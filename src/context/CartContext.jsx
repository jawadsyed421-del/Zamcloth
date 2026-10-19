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

    const addToCart = (product, size = 'M', color = 'Standard') => {
        setCartItems(prev => {
            const existing = prev.find(item => item.id === product.id && item.size === size);
            if (existing) {
                return prev.map(item =>
                    (item.id === product.id && item.size === size)
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, size, color, quantity: 1 }];
        });
        setIsCartOpen(true);
    };

    const removeFromCart = (id, size) => {
        setCartItems(prev => prev.filter(item => !(item.id === id && item.size === size)));
    };

    const updateQuantity = (id, size, delta) => {
        setCartItems(prev => prev.map(item => {
            if (item.id === id && item.size === size) {
                return { ...item, quantity: Math.max(1, item.quantity + delta) };
            }
            return item;
        }));
    };

    const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

    const toggleCart = () => setIsCartOpen(!isCartOpen);

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
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
