"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { CustomUser } from "@/app/api/auth/[...nextauth]/options";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";
import getStripe from "@/lib/stripe";
import { Sparkles } from "lucide-react";

export default function Pricing({ user }: { user?: CustomUser }) {
  const [loading, setLoading] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const initiatePayment = async (plan: string) => {
    if (!user) {
      toast.error("Please login first.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post("/api/stripe/session", { plan: plan });
      if (data?.id) {
        const stripe = await getStripe();
        await stripe?.redirectToCheckout({ sessionId: data?.id });
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      if (error instanceof AxiosError) {
        toast.error(error?.response?.data?.message);
      } else {
        toast.error("Something went wrong. Please try again!");
      }
    }
  };

  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h2>
          <p className="text-2xl font-bold">
            <span className="text-indigo-500">1 coin = 1 ₹</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              title: "Starter",
              description: "Perfect for individuals.",
              coins: "100",
              features: [
                "10 Podcast Summary",
                "Top Questions Highlight",
                "AI-Powered Insights"
              ],
              plan: "Starter",
              isPro: false
            },
            {
              title: "Pro",
              description: "Best for professionals.",
              coins: "500",
              features: [
                "51 Podcast Summaries",
                "Top Questions Highlight",
                "AI-Powered Insights",
                "Priority Support",
                "Get One Podcast Summary Free 🚀"
              ],
              plan: "Pro",
              isPro: true
            },
            {
              title: "Pro Plus",
              description: "Ideal for teams.",
              coins: "1000",
              features: [
                "102 Podcast Summaries",
                "Top Questions Highlight",
                "AI-Powered Insights",
                "Dedicated Support",
                "Get two Podcast Summary Free 🚀"
              ],
              plan: "Pro Plus",
              isPro: false
            }
          ].map((tier) => (
            <Card
              key={tier.title}
              className={cn(
                "relative transform transition-all duration-300 hover:scale-105",
                {
                  "border-2 border-indigo-500": tier.isPro,
                  "shadow-xl": hoveredCard === tier.title,
                  "shadow-lg": hoveredCard !== tier.title
                }
              )}
              onMouseEnter={() => setHoveredCard(tier.title)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {tier.isPro && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl font-bold">{tier.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{tier.description}</p>
              </CardHeader>

              <CardContent>
                <div className="mb-6">
                  <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {tier.coins} Coins
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-2 text-gray-600 dark:text-gray-300"
                    >
                      <svg
                        className="w-5 h-5 text-indigo-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  className={cn(
                    "w-full transition-all duration-300",
                    tier.isPro
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                      : ""
                  )}
                  onClick={() => initiatePayment(tier.plan)}
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Buy Coins"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}