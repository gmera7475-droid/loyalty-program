import { supabase } from '../lib/supabaseClient';



// 1. Obtener o crear la tarjeta de lealtad de un cliente para un negocio
export async function getOrCreateCustomerCard(businessId, customerId) {
  try {
    // Buscar tarjeta existente
    let { data: card, error } = await supabase
      .from('loyalty_cards')
      .select('*')
      .eq('business_id', businessId)
      .eq('customer_id', customerId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Si no existe, la creamos con 0 sellos
      const { data: newCard, error: createError } = await supabase
        .from('loyalty_cards')
        .insert([{ business_id: businessId, customer_id: customerId, current_stamps: 0 }])
        .select()
        .single();

      if (createError) throw createError;
      return newCard;
    } else if (error) {
      throw error;
    }

    return card;
  } catch (err) {
    console.error('Error en getOrCreateCustomerCard:', err.message);
    return null;
  }
}

// 2. Sumar un sello a la tarjeta (Registra transacción y actualiza contador)
export async function addStamp(loyaltyCardId, staffId) {
  try {
    // A. Registrar la transacción
    const { error: txError } = await supabase
      .from('transactions')
      .insert([{
        loyalty_card_id: loyaltyCardId,
        staff_id: staffId,
        type: 'earn_stamp',
        stamps_added: 1
      }]);

    if (txError) throw txError;

    // B. Obtener tarjeta actual para incrementar sellos
    const { data: card, error: fetchError } = await supabase
      .from('loyalty_cards')
      .select('current_stamps, max_stamps')
      .eq('id', loyaltyCardId)
      .single();

    if (fetchError) throw fetchError;

    const nextStamps = Math.min(card.current_stamps + 1, card.max_stamps);

    // C. Actualizar la tarjeta de lealtad
    const { data: updatedCard, error: updateError } = await supabase
      .from('loyalty_cards')
      .update({ current_stamps: nextStamps, updated_at: new Date() })
      .eq('id', loyaltyCardId)
      .select()
      .single();

    if (updateError) throw updateError;
    return { success: true, card: updatedCard };
  } catch (err) {
    console.error('Error al sumar sello:', err.message);
    return { success: false, error: err.message };
  }
}

// 3. Canjear recompensa (Reinicia los sellos a 0)
export async function redeemReward(loyaltyCardId, staffId) {
  try {
    const { error: txError } = await supabase
      .from('transactions')
      .insert([{
        loyalty_card_id: loyaltyCardId,
        staff_id: staffId,
        type: 'redeem_reward',
        stamps_added: 0
      }]);

    if (txError) throw txError;

    const { data: updatedCard, error: updateError } = await supabase
      .from('loyalty_cards')
      .update({ current_stamps: 0, updated_at: new Date() })
      .eq('id', loyaltyCardId)
      .select()
      .single();

    if (updateError) throw updateError;
    return { success: true, card: updatedCard };
  } catch (err) {
    console.error('Error al canjear premio:', err.message);
    return { success: false, error: err.message };
  }
}

// 4. Registrar un nuevo cliente desde el QR del mostrador (Onboarding rápido)
export async function registerNewCustomer(businessId, fullName, phone) {
  try {
    const newCustomerId = crypto.randomUUID();

    // 0. Consultar cuántos sellos exige este negocio
    const { data: bizData } = await supabase
      .from('businesses')
      .select('stamps_required')
      .eq('id', businessId)
      .single();

    const maxStamps = bizData?.stamps_required || 10;

    // 1. Insertar perfil del cliente
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: newCustomerId,
        full_name: fullName,
        phone: phone,
        role: 'customer'
      }]);

    if (profileError) {
      throw new Error(`Error en perfil: ${profileError.message}`);
    }

    // 2. Crear tarjeta de lealtad con los sellos configurados por el negocio
    const { data: card, error: cardError } = await supabase
      .from('loyalty_cards')
      .insert([{
        business_id: businessId,
        customer_id: newCustomerId,
        current_stamps: 0,
        max_stamps: maxStamps
      }])
      .select()
      .single();

    if (cardError) {
      throw new Error(`Error en tarjeta: ${cardError.message}`);
    }

    return { success: true, customerId: newCustomerId, card };
  } catch (err) {
    console.error('Error en registerNewCustomer:', err.message);
    return { success: false, error: err.message };
  }
}