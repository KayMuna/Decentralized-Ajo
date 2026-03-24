'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Users, TrendingUp, Calendar, Coins } from 'lucide-react';
import { toast } from 'sonner';
import { authenticatedFetch } from '@/lib/auth-client';
import { formatXLM } from '@/lib/utils';
import { CircleOverview } from './components/CircleOverview';
import { MemberTable } from './components/MemberTable';
import { ContributionHistory } from './components/ContributionHistory';
import { OrganizerActions } from './components/OrganizerActions';

interface Member {
  id: string;
  userId: string;
  rotationOrder: number;
  status: string;
  totalContributed: number;
  totalWithdrawn: number;
  hasReceivedPayout: boolean;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    walletAddress?: string;
  };
}

interface Contribution {
  id: string;
  amount: number;
  round: number;
  status: string;
  createdAt: string;
  completedAt?: string;
  txHash?: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
}

interface Circle {
  id: string;
  name: string;
  description?: string;
  organizerId: string;
  contributionAmount: number;
  contributionFrequencyDays: number;
  maxRounds: number;
  currentRound: number;
  status: string;
  contractAddress?: string;
  contractDeployed: boolean;
  members: Member[];
  contributions: Contribution[];
  organizer: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

function DetailSkeleton() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
      </header>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    </main>
  );
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'ACTIVE':
      return 'default';
    case 'PENDING':
      return 'secondary';
    case 'COMPLETED':
      return 'outline';
    case 'CANCELLED':
      return 'destructive';
    default:
      return 'secondary';
  }
}

export default function CircleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const circleId = params.id as string;

  const [circle, setCircle] = useState<Circle | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
    fetchCircle();
  }, []);

  const fetchCircle = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await authenticatedFetch(`/api/circles/${circleId}`);

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Circle not found');
          router.push('/');
        } else if (response.status === 403) {
          toast.error('You do not have access to this circle');
          router.push('/');
        } else if (response.status === 401) {
          router.push('/auth/login');
        }
        return;
      }

      const data = await response.json();
      setCircle(data.circle);
    } catch (error) {
      console.error('Error fetching circle:', error);
      toast.error('Failed to load circle');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DetailSkeleton />;
  }

  if (!circle) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Circle not found</p>
          <Button asChild className="mt-4">
            <Link href="/">Back to Dashboard</Link>
          </Button>
        </div>
      </main>
    );
  }

  const isOrganizer = currentUser?.id === circle.organizerId;
  const isMember = circle.members.some((m) => m.userId === currentUser?.id);
  const totalPot = circle.members.length * circle.contributionAmount * circle.currentRound;

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <Link href="/" className="flex items-center text-primary hover:underline mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">{circle.name}</h1>
                <Badge variant={getStatusVariant(circle.status)}>
                  {circle.status}
                </Badge>
              </div>
              {circle.description && (
                <p className="text-muted-foreground mt-2">{circle.description}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Current Pot</p>
              <p className="text-3xl font-bold text-primary">{formatXLM(totalPot)} XLM</p>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Members</p>
                <p className="text-lg font-bold">{circle.members.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Round</p>
                <p className="text-lg font-bold">
                  {circle.currentRound} / {circle.maxRounds}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Per Round</p>
                <p className="text-lg font-bold">{formatXLM(circle.contributionAmount)} XLM</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Coins className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Payout</p>
                <p className="text-lg font-bold">
                  {formatXLM(circle.contributionAmount * circle.members.length)} XLM
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {!isMember && !isOrganizer ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              You are not a member of this circle yet.
            </p>
            <Button asChild size="lg">
              <Link href={`/circles/${circle.id}/join`}>Join This Circle</Link>
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              {isOrganizer && <TabsTrigger value="admin">Admin</TabsTrigger>}
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <CircleOverview
                circle={circle}
                isOrganizer={isOrganizer}
                isMember={isMember}
                onRefresh={fetchCircle}
              />
            </TabsContent>

            <TabsContent value="members" className="mt-6">
              <MemberTable
                members={circle.members}
                organizerId={circle.organizerId}
                currentRound={circle.currentRound}
              />
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <ContributionHistory contributions={circle.contributions} />
            </TabsContent>

            {isOrganizer && (
              <TabsContent value="admin" className="mt-6">
                <OrganizerActions circle={circle} onRefresh={fetchCircle} />
              </TabsContent>
            )}
          </Tabs>
        )}
      </div>
    </main>
  );
}
