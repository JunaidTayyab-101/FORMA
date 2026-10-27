import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import StoreLayout from "./layouts/StoreLayout.jsx";
import Home from "./pages/Home.jsx";
import Shop from "./pages/Shop.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import OrderSuccess from "./pages/OrderSuccess.jsx";
import Wishlist from "./pages/Wishlist.jsx";
import StaticPage from "./pages/StaticPage.jsx";
import NotFound from "./pages/NotFound.jsx";

const AdminRoutes = lazy(() => import("./admin/AdminRoutes.jsx"));


function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}


export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="admin/*" element={<Suspense fallback={<div className="p-10 text-center text-sm text-muted">Loading admin…</div>}><AdminRoutes /></Suspense>} />
        <Route element={<StoreLayout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="product/:slug" element={<ProductDetails />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="order/:number" element={<OrderSuccess />} />
          <Route path="wishlist" element={<Wishlist />} />
          {["about", "contact", "faq", "interior-design", "shipping-policy", "returns-policy", "privacy-policy", "terms"].map((p) => (
            <Route key={p} path={p} element={<StaticPage slug={p} />} />
          ))}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
