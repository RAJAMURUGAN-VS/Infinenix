import { useEffect, useRef, useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

interface SavedImage {
  id: number;
  data: string;
  timestamp: string;
  title: string;
}

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LibraryModal = ({ isOpen, onClose }: LibraryModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<SavedImage | null>(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedImage) {
          setSelectedImage(null);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      // Load saved images when modal opens
      const images = JSON.parse(localStorage.getItem('savedImages') || '[]');
      setSavedImages(images);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, selectedImage]);

  const handleDeleteImage = (id: number) => {
    const updatedImages = savedImages.filter(img => img.id !== id);
    localStorage.setItem('savedImages', JSON.stringify(updatedImages));
    setSavedImages(updatedImages);
  };

  const handleImageClick = (image: SavedImage) => {
    setSelectedImage(image);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div
          ref={modalRef}
          className={cn(
            "relative w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl transform transition-all duration-300 ease-out",
            isDarkMode ? "bg-slate-800" : "bg-white"
          )}
          style={{
            animation: 'slideIn 0.3s ease-out forwards',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className={cn("text-2xl font-semibold", isDarkMode ? "text-white" : "text-gray-800")}>
              Saved Study Tools
            </h2>
            <button
              onClick={onClose}
              className={cn(
                "p-2 rounded-full transition-colors",
                isDarkMode ? "hover:bg-slate-700" : "hover:bg-gray-100"
              )}
            >
              <X className={cn("w-5 h-5", isDarkMode ? "text-gray-300" : "text-gray-500")} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {savedImages.length === 0 ? (
              <div className={cn(
                "text-center py-8",
                isDarkMode ? "text-gray-300" : "text-gray-500"
              )}>
                No saved study tools yet
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedImages.map((image) => (
                  <div
                    key={image.id}
                    className={cn(
                      "relative group rounded-xl overflow-hidden",
                      isDarkMode ? "bg-slate-700" : "bg-gray-50"
                    )}
                  >
                    <img
                      src={image.data}
                      alt={image.title}
                      className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => handleImageClick(image)}
                    />
                    <div className="p-3">
                      <h3 className={cn(
                        "text-sm font-medium mb-1",
                        isDarkMode ? "text-white" : "text-gray-800"
                      )}>
                        {image.title}
                      </h3>
                      <p className={cn(
                        "text-xs",
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      )}>
                        {new Date(image.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteImage(image.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedImage(null)}
          />
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <img
              src={selectedImage.data}
              alt={selectedImage.title}
              className="max-w-full max-h-[90vh] object-contain"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Add keyframes for slide-in animation */}
      <style>
        {`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        `}
      </style>
    </>
  );
};

export default LibraryModal; 