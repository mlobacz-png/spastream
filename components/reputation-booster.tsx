'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Star, ThumbsUp, ThumbsDown, Send, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface Review {
  id: string;
  platform: string;
  review_text: string;
  rating: number;
  sentiment: string;
  response_generated: string;
  response_sent: boolean;
  created_at: string;
}

export function ReputationBooster() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState('5');
  const [platform, setPlatform] = useState('google');
  const { user } = useAuth();

  useEffect(() => {
    fetchReviews();
  }, [user]);

  const fetchReviews = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('reviews_monitoring')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setReviews(data);
  };

  const analyzeSentiment = (text: string, rating: number): string => {
    const lowerText = text.toLowerCase();
    const negativeWords = ['bad', 'terrible', 'awful', 'worst', 'disappointed', 'unhappy', 'rude', 'unprofessional'];
    const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'best', 'love', 'recommend', 'professional'];

    const hasNegative = negativeWords.some(word => lowerText.includes(word));
    const hasPositive = positiveWords.some(word => lowerText.includes(word));

    if (rating <= 2) return 'negative';
    if (rating >= 4 && hasPositive) return 'positive';
    if (hasNegative) return 'negative';
    return 'neutral';
  };

  const generateResponse = (review: string, rating: number, sentiment: string): string => {
    if (sentiment === 'positive') {
      return `Thank you so much for your wonderful ${rating}-star review! We're thrilled to hear you had such a positive experience with our services. Your satisfaction is our top priority, and we look forward to seeing you again soon. If you have any questions or would like to book your next appointment, please don't hesitate to reach out!`;
    }

    if (sentiment === 'negative') {
      return `Thank you for taking the time to share your feedback. We sincerely apologize that your experience didn't meet your expectations. Your concerns are very important to us, and we'd like the opportunity to make this right. Please contact our office directly so we can discuss your experience in detail and find a resolution. We're committed to providing the highest quality care and service to all our clients.`;
    }

    return `Thank you for your review and for choosing our practice. We appreciate your feedback and are always working to improve our services. If there's anything specific we can do to enhance your experience, please let us know. We look forward to serving you again!`;
  };

  const addReview = async () => {
    if (!user || !reviewText.trim()) return;

    const numRating = parseInt(rating);
    const sentiment = analyzeSentiment(reviewText, numRating);
    const responseGenerated = generateResponse(reviewText, numRating, sentiment);

    await supabase.from('reviews_monitoring').insert([{
      user_id: user.id,
      platform,
      review_text: reviewText,
      rating: numRating,
      sentiment,
      response_generated: responseGenerated,
      response_sent: false,
    }]);

    setReviewText('');
    setRating('5');
    await fetchReviews();
  };

  const sendResponse = async (reviewId: string) => {
    await supabase
      .from('reviews_monitoring')
      .update({ response_sent: true })
      .eq('id', reviewId);
    await fetchReviews();
  };

  const getSentimentIcon = (sentiment: string) => {
    if (sentiment === 'positive') return <ThumbsUp className="w-5 h-5 text-green-600" />;
    if (sentiment === 'negative') return <ThumbsDown className="w-5 h-5 text-red-600" />;
    return <Star className="w-5 h-5 text-yellow-600" />;
  };

  const getSentimentColor = (sentiment: string) => {
    if (sentiment === 'positive') return 'bg-green-100 text-green-700 border-green-200';
    if (sentiment === 'negative') return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const positiveCount = reviews.filter(r => r.sentiment === 'positive').length;
  const negativeCount = reviews.filter(r => r.sentiment === 'negative').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
          <Star className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-light text-slate-800">Reputation Booster</h2>
          <p className="text-sm text-slate-600">Monitor reviews and generate AI-powered responses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Avg Rating</p>
                <p className="text-3xl font-light text-slate-800">{avgRating} ⭐</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-green-50 to-teal-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Positive</p>
                <p className="text-3xl font-light text-slate-800">{positiveCount}</p>
              </div>
              <ThumbsUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-red-50 to-pink-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Negative</p>
                <p className="text-3xl font-light text-slate-800">{negativeCount}</p>
              </div>
              <ThumbsDown className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Add Review (Simulate)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="yelp">Yelp</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
              </SelectContent>
            </Select>
            <Select value={rating} onValueChange={setRating}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 Stars ⭐⭐⭐⭐⭐</SelectItem>
                <SelectItem value="4">4 Stars ⭐⭐⭐⭐</SelectItem>
                <SelectItem value="3">3 Stars ⭐⭐⭐</SelectItem>
                <SelectItem value="2">2 Stars ⭐⭐</SelectItem>
                <SelectItem value="1">1 Star ⭐</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Enter review text..."
            className="rounded-xl min-h-24"
          />
          <Button
            onClick={addReview}
            disabled={!reviewText.trim()}
            className="w-full rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 h-12"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Analyze & Generate Response
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-800">Recent Reviews</h3>
        {reviews.length === 0 ? (
          <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Star className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-500">No reviews yet. Add a simulated review above to test AI responses.</p>
            </CardContent>
          </Card>
        ) : (
          reviews.map(review => (
            <Card key={review.id} className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Badge className={`rounded-full border ${getSentimentColor(review.sentiment)}`}>
                      {getSentimentIcon(review.sentiment)}
                      <span className="ml-1 capitalize">{review.sentiment}</span>
                    </Badge>
                    <Badge variant="outline" className="rounded-full capitalize">{review.platform}</Badge>
                    <div className="flex">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">
                    {format(new Date(review.created_at), 'MMM dd, yyyy')}
                  </span>
                </div>

                <p className="text-slate-700 mb-4 italic">"{review.review_text}"</p>

                <Alert className="border-blue-200 bg-blue-50 mb-4">
                  <Send className="h-4 w-4 text-blue-600" />
                  <AlertDescription>
                    <p className="text-sm font-medium text-blue-900 mb-2">AI-Generated Response:</p>
                    <p className="text-sm text-blue-800">{review.response_generated}</p>
                  </AlertDescription>
                </Alert>

                <Button
                  size="sm"
                  onClick={() => sendResponse(review.id)}
                  disabled={review.response_sent}
                  className="rounded-full"
                >
                  <Send className="w-3 h-3 mr-1" />
                  {review.response_sent ? 'Response Sent' : 'Send Response'}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
