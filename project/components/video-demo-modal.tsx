'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Play, Sparkles, X } from 'lucide-react';

export function VideoDemoModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className="relative group cursor-pointer rounded-2xl overflow-hidden shadow-2xl max-w-4xl mx-auto transform transition-all hover:scale-[1.02] hover:shadow-3xl"
      >
        <div className="aspect-video bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col items-center justify-center p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />

          <div className="relative z-10 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center animate-pulse">
              <Sparkles className="w-8 h-8 text-white" />
            </div>

            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              See SpaStream in Action
            </h3>

            <p className="text-lg text-slate-300 mb-8 max-w-2xl">
              Watch a 5-minute walkthrough of how SpaStream helps med spas save time and increase revenue
            </p>

            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-slate-100 text-lg px-8 py-6 rounded-full shadow-xl group-hover:scale-110 transition-transform"
            >
              <Play className="w-6 h-6 mr-2 fill-current" />
              Watch Demo Video
            </Button>
          </div>

          <div className="absolute top-4 right-4 bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 rounded-full px-4 py-2 text-white text-sm font-medium">
            5 min
          </div>

          <div className="absolute inset-0 border-4 border-transparent group-hover:border-blue-400/50 transition-colors rounded-2xl" />
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-6xl p-0 bg-black border-0">
          <DialogTitle className="sr-only">SpaStream Demo Video</DialogTitle>
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 z-50 rounded-full bg-black/50 hover:bg-black/70 p-2 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="relative aspect-video">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/cFDeB0Mx4Ao"
              title="SpaStream Demo"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
