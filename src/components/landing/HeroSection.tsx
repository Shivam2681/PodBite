"use client"

import React from "react";
import { Button } from "../ui/button";
import { Sparkles, Mic, Wand2 } from "lucide-react";

export default function HeroSection() {
  return (
    <header className="relative min-h-[80vh] flex flex-col items-center justify-center py-24 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-pink-100/20 via-purple-100/20 to-transparent dark:from-pink-950/20 dark:via-purple-950/20 dark:to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.15),transparent)] dark:bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05),transparent)]" />
      
      {/* Floating Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-1/4 w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full blur-xl opacity-20 animate-float" />
        <div className="absolute bottom-20 right-1/4 w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full blur-xl opacity-20 animate-float-delay" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Main Content */}
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Icon Grid */}
          <div className="flex justify-center gap-4 mb-8">
            <div className="bg-white/90 dark:bg-gray-800/90 p-3 rounded-2xl shadow-lg backdrop-blur-sm">
              <Mic className="w-6 h-6 text-pink-500" />
            </div>
            <div className="bg-white/90 dark:bg-gray-800/90 p-3 rounded-2xl shadow-lg backdrop-blur-sm">
              <Wand2 className="w-6 h-6 text-purple-500" />
            </div>
            <div className="bg-white/90 dark:bg-gray-800/90 p-3 rounded-2xl shadow-lg backdrop-blur-sm">
              <Sparkles className="w-6 h-6 text-pink-500" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-6xl font-extrabold">
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent animate-gradient">
              Summarize Any Podcast
            </span>
            <br />
            <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              Instantly
            </span>
          </h1>

          {/* Description */}
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Use AI to get concise summaries and top questions from your favorite
            podcasts.
          </p>

          {/* CTA Button */}
          <div className="flex justify-center mt-8">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <Button className="relative px-8 py-6 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <span className="relative z-10 flex items-center gap-2">
                  Try it Now
                  <Sparkles className="w-5 h-5" />
                </span>
              </Button>
            </div>
          </div>

          {/* Stats or Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-8 mt-12 text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <span className="font-bold text-2xl bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">1000+</span>
              <span>Podcasts Summarized</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-2xl bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">500+</span>
              <span>Happy Users</span>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delay {
          animation: float 6s ease-in-out infinite;
          animation-delay: -3s;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 8s ease infinite;
        }
      `}</style>
    </header>
  );
}