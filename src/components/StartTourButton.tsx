import { useTour } from '@reactour/tour';
import { cn } from "@/lib/utils";

export const StartTourButton = () => {
    const { setIsOpen } = useTour();

    return (
        <button
            className={cn(
                "group relative flex items-center gap-2 h-10 px-3 rounded-lg font-medium text-sm transition-all duration-300 overflow-hidden",
                "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500",
                "text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            )}
            onClick={() => setIsOpen(true)}
        >
            {/* Animated background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            {/* Text with shimmer effect */}
            <div className="relative z-10">
                <span className="font-semibold">Start Tutor</span>
            </div>
        </button>
    );
};