import { Suspense, lazy } from 'react';
import { MotionConfig } from 'framer-motion';
import { Backdrop } from '../../components/Layout';
import Navbar from './Navbar';
import HeroSection from './HeroSection';

const HowItWorksSection = lazy(() => import('./HowItWorksSection'));
const RolesSection = lazy(() => import('./RolesSection'));
const RoomsDemoSection = lazy(() => import('./RoomsDemoSection'));
const TrackedSection = lazy(() => import('./TrackedSection'));
const DemoAccountsSection = lazy(() => import('./DemoAccountsSection'));
const FaqSection = lazy(() => import('./FaqSection'));
const FinalCtaSection = lazy(() => import('./FinalCtaSection'));

function SectionSkeleton({ height = 'h-64' }: { height?: string }) {
  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8" aria-hidden>
      <div className={`glass mx-auto max-w-6xl animate-pulse ${height} bg-white/50`} />
    </div>
  );
}

export default function Landing() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-clip">
        <Backdrop />
        <Navbar />
        <main>
          <HeroSection />
          <Suspense fallback={<SectionSkeleton height="h-56" />}>
            <HowItWorksSection />
          </Suspense>
          <Suspense fallback={<SectionSkeleton height="h-72" />}>
            <RolesSection />
          </Suspense>
          <Suspense fallback={<SectionSkeleton height="h-72" />}>
            <RoomsDemoSection />
          </Suspense>
          <Suspense fallback={<SectionSkeleton height="h-80" />}>
            <TrackedSection />
          </Suspense>
          <Suspense fallback={<SectionSkeleton height="h-64" />}>
            <DemoAccountsSection />
          </Suspense>
          <Suspense fallback={<SectionSkeleton height="h-64" />}>
            <FaqSection />
          </Suspense>
          <Suspense fallback={<SectionSkeleton height="h-44" />}>
            <FinalCtaSection />
          </Suspense>
        </main>
      </div>
    </MotionConfig>
  );
}

