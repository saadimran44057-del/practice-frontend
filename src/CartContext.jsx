import { createContext, useContext } from 'react';

// The shopping cart lives in App. Any component can read it with useCart()
// instead of passing it through every page.
export const CartContext = createContext(null);

export const useCart = () => useContext(CartContext);