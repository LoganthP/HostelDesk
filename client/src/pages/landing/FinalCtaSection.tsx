import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button, spring } from '../../components/ui';

export default function FinalCtaSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();

  return (
    <section className="px-4 pt-14 pb-16 sm:px-6 sm:pt-16 sm:pb-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={spring}
          className="glass-strong flex flex-col items-start justify-between gap-6 p-7 sm:p-10 lg:flex-row lg:items-center"
        >
          <div className="max-w-xl">
            <h2 className="text-3xl font-extrabold sm:text-4xl">Ready to report an issue or explore a dashboard?</h2>
            <p className="mt-2.5 text-base text-slate-600">
              Create your student account in seconds, or sign in with one of the demo accounts to inspect every role.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              onClick={() => navigate(user ? '/dashboard' : '/register')}
              icon={<ArrowRight className="h-4 w-4" />}
            >
              Create a student account
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate(user ? '/dashboard' : '/login')}
            >
              Sign in
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

