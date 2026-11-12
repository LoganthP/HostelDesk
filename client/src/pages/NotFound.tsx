import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Backdrop } from '../components/Layout';
import { buttonClass, Card, EmptyState } from '../components/ui';

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center p-4">
      <Backdrop />
      <Card className="w-full max-w-md">
        <EmptyState
          icon={Compass}
          title="This page doesn't exist"
          text="The link may be old or mistyped."
          action={<Link to="/dashboard" className={buttonClass()}>Go to overview</Link>}
        />
      </Card>
    </div>
  );
}
