import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Marquee from './components/Marquee';
import CartDrawer from './components/CartDrawer';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import Checkout from './pages/Checkout';
import SizeGuide from './pages/SizeGuide';
import Admin from './pages/Admin';
import Auth from './pages/Auth';
import Account from './pages/Account';

function Layout() {
  const isAdmin = useLocation().pathname.startsWith('/admin');
  return (
    <div className="app-wrapper">
      {!isAdmin && <Marquee />}
      {!isAdmin && <Navbar />}
      {!isAdmin && <CartDrawer />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/size-guide" element={<SizeGuide />} />
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/register" element={<Auth mode="register" />} />
        <Route path="/account" element={<Account />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      {!isAdmin && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
    <CartProvider>
      <Router>
        <ScrollToTop />
        <Layout />
      </Router>
    </CartProvider>
    </AuthProvider>
  );
}

export default App;
