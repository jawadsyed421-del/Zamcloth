import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        const localData = localStorage.getItem('zamcloth_cart');
        return localData ? JSON.parse(localData) : [];
    });
    const [isCartOpen, setIsCartOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('zamcloth_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const sameLine = (item, id, size, color) => item.id === id && item.size === size && (item.color || '') === (color || '');

    const addToCart = (product, size = 'One Size', color = '') => {
        setCartItems(prev => {
            const existing = prev.find(item => sameLine(item, product.id, size, color));
            if (existing) {
                return prev.map(item =>
                    sameLine(item, product.id, size, color)
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, size, color, quantity: 1 }];
        });
        setIsCartOpen(true);
    };

    const removeFromCart = (id, size, color = '') => {
        setCartItems(prev => prev.filter(item => !sameLine(item, id, size, color)));
    };

    const updateQuantity = (id, size, delta, color = '') => {
        setCartItems(prev => prev.map(item => {
            if (sameLine(item, id, size, color)) {
                return { ...item, quantity: Math.max(1, item.quantity + delta) };
            }
            return item;
        }));
    };

    const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

    const clearCart = () => setCartItems([]);

    const toggleCart = () => setIsCartOpen(!isCartOpen);

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            clearCart,
            updateQuantity,
            cartTotal,
            cartCount,
            isCartOpen,
            setIsCartOpen,
            toggleCart
        }}>
            {children}
        </CartContext.Provider>
    );
};
