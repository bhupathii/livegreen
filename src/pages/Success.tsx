import React, { useState, useEffect } from "react";
import { useLocation, Link, useSearchParams } from "react-router-dom";
import { CheckCircle, ArrowRight, ShoppingBag, Home, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import NpsSurveyPopup from "@/components/NpsSurveyPopup";

export default function Success() {
  const location = useLocation();
  const { orderId, paymentId } = location.state || {};

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAFA] px-4 text-center py-20">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-green-100 shadow-xl shadow-green-100"
      >
        <CheckCircle className="h-14 w-14 text-[#1B5E20]" />
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-4 font-serif text-4xl font-bold text-[#1B5E20] sm:text-5xl"
      >
        Order Confirmed!
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mb-10 max-w-md text-lg text-gray-600 font-poppins"
      >
        Thank you for your purchase. Your order has been received and is being processed with care.
      </motion.p>

      {orderId && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-10 rounded-2xl bg-white p-8 shadow-lg border border-gray-100 w-full max-w-md relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1B5E20] to-[#3A8E3C]" />
          <h3 className="text-lg font-bold text-[#1B5E20] mb-6 font-serif">Order Details</h3>

          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-gray-50">
              <span className="text-gray-500">Order ID</span>
              <span className="font-mono font-bold text-[#1B5E20]">{orderId}</span>
            </div>
            {paymentId && (
              <div className="flex justify-between py-3 border-b border-gray-50">
                <span className="text-gray-500">Payment ID</span>
                <span className="font-mono font-medium text-gray-800">{paymentId}</span>
              </div>
            )}
            <div className="flex justify-between py-3">
              <span className="text-gray-500">Status</span>
              <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                Processing
              </span>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <Link to="/track-order">
          <Button className="h-12 px-8 rounded-xl bg-[#1B5E20] hover:bg-[#144a18] text-base">
            <Truck className="mr-2 h-4 w-4" /> Track Order
          </Button>
        </Link>
        <Link to="/shop">
          <Button variant="outline" className="h-12 px-8 rounded-xl border-gray-200 text-base">
            <ShoppingBag className="mr-2 h-4 w-4" /> Continue Shopping
          </Button>
        </Link>
        <Link to="/">
          <Button variant="outline" className="h-12 px-8 rounded-xl border-gray-200 text-base">
            <Home className="mr-2 h-4 w-4" /> Back Home
          </Button>
        </Link>
      </motion.div>

      {/* NPS Survey Popup — shows 5 seconds after page load */}
      <NpsSurveyPopup orderId={orderId} delay={5000} />
    </div>
  );
}
