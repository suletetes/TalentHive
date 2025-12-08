import React, { useState } from 'react';
import { Container, Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { CreateTicketForm } from '@/components/support/CreateTicketForm';
import { createTicket } from '@/store/slices/supportTicketSlice';
import { AppDispatch } from '@/store';
import { CreateTicketData } from '@/services/api/supportTicket.service';
import toast from 'react-hot-toast';

export const CreateTicketPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateTicketData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await dispatch(createTicket(data)).unwrap();
      toast.success('Support ticket created successfully!');
      navigate(`/dashboard/support/${result._id}`);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create ticket. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/support');
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <CreateTicketForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        error={error}
      />
    </Container>
  );
};
