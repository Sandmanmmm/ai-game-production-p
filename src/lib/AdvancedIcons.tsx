// Critical icons for advanced features - bypassing the proxy issues
import React from 'react';

// Import icons directly from their specific paths to bypass proxy
export const AdvancedIcons = {
  // Preview Workspace Icons (Most Critical)
  MonitorPlay: React.lazy(() => import('@phosphor-icons/react/dist/csr/MonitorPlay').then(module => ({ default: module.MonitorPlay }))),
  ArrowsOut: React.lazy(() => import('@phosphor-icons/react/dist/csr/ArrowsOut').then(module => ({ default: module.ArrowsOut }))),
  ArrowsIn: React.lazy(() => import('@phosphor-icons/react/dist/csr/ArrowsIn').then(module => ({ default: module.ArrowsIn }))),
  Play: React.lazy(() => import('@phosphor-icons/react/dist/csr/Play').then(module => ({ default: module.Play }))),
  Pause: React.lazy(() => import('@phosphor-icons/react/dist/csr/Pause').then(module => ({ default: module.Pause }))),
  Bug: React.lazy(() => import('@phosphor-icons/react/dist/csr/Bug').then(module => ({ default: module.Bug }))),
  SpeakerHigh: React.lazy(() => import('@phosphor-icons/react/dist/csr/SpeakerHigh').then(module => ({ default: module.SpeakerHigh }))),
  SpeakerX: React.lazy(() => import('@phosphor-icons/react/dist/csr/SpeakerX').then(module => ({ default: module.SpeakerX }))),
  DeviceMobile: React.lazy(() => import('@phosphor-icons/react/dist/csr/DeviceMobile').then(module => ({ default: module.DeviceMobile }))),
  Desktop: React.lazy(() => import('@phosphor-icons/react/dist/csr/Desktop').then(module => ({ default: module.Desktop }))),
  DeviceTablet: React.lazy(() => import('@phosphor-icons/react/dist/csr/DeviceTablet').then(module => ({ default: module.DeviceTablet }))),
  GameController: React.lazy(() => import('@phosphor-icons/react/dist/csr/GameController').then(module => ({ default: module.GameController }))),

  // Asset Studio Icons (Complex Interface)  
  Palette: React.lazy(() => import('@phosphor-icons/react/dist/csr/Palette').then(module => ({ default: module.Palette }))),
  Image: React.lazy(() => import('@phosphor-icons/react/dist/csr/Image').then(module => ({ default: module.Image }))),
  MusicNote: React.lazy(() => import('@phosphor-icons/react/dist/csr/MusicNote').then(module => ({ default: module.MusicNote }))),
  Cube: React.lazy(() => import('@phosphor-icons/react/dist/csr/Cube').then(module => ({ default: module.Cube }))),
  Eye: React.lazy(() => import('@phosphor-icons/react/dist/csr/Eye').then(module => ({ default: module.Eye }))),
  Download: React.lazy(() => import('@phosphor-icons/react/dist/csr/Download').then(module => ({ default: module.Download }))),
  Heart: React.lazy(() => import('@phosphor-icons/react/dist/csr/Heart').then(module => ({ default: module.Heart }))),
  Upload: React.lazy(() => import('@phosphor-icons/react/dist/csr/Upload').then(module => ({ default: module.Upload }))),
  MagnifyingGlass: React.lazy(() => import('@phosphor-icons/react/dist/csr/MagnifyingGlass').then(module => ({ default: module.MagnifyingGlass }))),

  // Story & Lore Icons
  Book: React.lazy(() => import('@phosphor-icons/react/dist/csr/Book').then(module => ({ default: module.Book }))),
  BookOpen: React.lazy(() => import('@phosphor-icons/react/dist/csr/BookOpen').then(module => ({ default: module.BookOpen }))),
  Users: React.lazy(() => import('@phosphor-icons/react/dist/csr/Users').then(module => ({ default: module.Users }))),
  Crown: React.lazy(() => import('@phosphor-icons/react/dist/csr/Crown').then(module => ({ default: module.Crown }))),
  Sword: React.lazy(() => import('@phosphor-icons/react/dist/csr/Sword').then(module => ({ default: module.Sword }))),
  Brain: React.lazy(() => import('@phosphor-icons/react/dist/csr/Brain').then(module => ({ default: module.Brain }))),

  // Navigation Icons
  House: React.lazy(() => import('@phosphor-icons/react/dist/csr/House').then(module => ({ default: module.House }))),
  FolderOpen: React.lazy(() => import('@phosphor-icons/react/dist/csr/FolderOpen').then(module => ({ default: module.FolderOpen }))),
  TestTube: React.lazy(() => import('@phosphor-icons/react/dist/csr/TestTube').then(module => ({ default: module.TestTube }))),
  Rocket: React.lazy(() => import('@phosphor-icons/react/dist/csr/Rocket').then(module => ({ default: module.Rocket }))),

  // Common UI Icons
  X: React.lazy(() => import('@phosphor-icons/react/dist/csr/X').then(module => ({ default: module.X }))),
  Plus: React.lazy(() => import('@phosphor-icons/react/dist/csr/Plus').then(module => ({ default: module.Plus }))),
  List: React.lazy(() => import('@phosphor-icons/react/dist/csr/List').then(module => ({ default: module.List }))),
  Sparkle: React.lazy(() => import('@phosphor-icons/react/dist/csr/Sparkle').then(module => ({ default: module.Sparkle }))),
  Gear: React.lazy(() => import('@phosphor-icons/react/dist/csr/Gear').then(module => ({ default: module.Gear }))),
  ArrowCounterClockwise: React.lazy(() => import('@phosphor-icons/react/dist/csr/ArrowCounterClockwise').then(module => ({ default: module.ArrowCounterClockwise }))),
};

// Wrapper component for lazy-loaded icons with fallback
export const AdvancedIcon: React.FC<{
  name: keyof typeof AdvancedIcons;
  size?: number;
  className?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}> = ({ name, size = 24, className = '', weight = 'regular' }) => {
  const IconComponent = AdvancedIcons[name];
  
  if (!IconComponent) {
    // Fallback to a simple div with text if icon doesn't exist
    return <div className={`inline-flex items-center justify-center w-6 h-6 text-xs ${className}`}>?</div>;
  }

  return (
    <React.Suspense fallback={<div className={`inline-block w-6 h-6 ${className}`} />}>
      <IconComponent size={size} className={className} weight={weight} />
    </React.Suspense>
  );
};
