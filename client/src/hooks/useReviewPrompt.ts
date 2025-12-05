import { useState, useEffect } from 'react';

interface ReviewPromptData {
  contractId: string;
  revieweeId: string;
  revieweeName: string;
  revieweeRole: 'client' | 'freelancer';
}

export const useReviewPrompt = () => {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState<ReviewPromptData | null>(null);

  const promptReview = (data: ReviewPromptData) => {
    setReviewData(data);
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    // Clear data after a delay to allow modal animation
    setTimeout(() => setReviewData(null), 300);
  };

  return {
    showReviewModal,
    reviewData,
    promptReview,
    closeReviewModal,
  };
};
