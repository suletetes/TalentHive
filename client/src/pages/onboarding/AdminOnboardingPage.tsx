import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { AdminOnboardingSteps } from '@/components/onboarding/AdminOnboardingSteps';
import { updateOnboardingStep, completeOnboarding, skipOnboarding } from '@/store/slices/onboardingSlice';
import { AppDispatch } from '@/store';
import toast from 'react-hot-toast';

const steps = ['Welcome', 'Admin Tools', 'Complete'];

export const AdminOnboardingPage = () => {
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const handleNext = async () => {
    try {
      await dispatch(updateOnboardingStep(activeStep + 1)).unwrap();
      setActiveStep((prev) => prev + 1);
    } catch (error) {
      toast.error('Failed to update progress');
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSkip = async () => {
    try {
      await dispatch(skipOnboarding()).unwrap();
      toast.success('Onboarding skipped');
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error('Failed to skip onboarding');
    }
  };

  const handleComplete = async () => {
    try {
      await dispatch(completeOnboarding()).unwrap();
      toast.success('Onboarding completed!');
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error('Failed to complete onboarding');
    }
  };

  return (
    <OnboardingWizard
      steps={steps}
      activeStep={activeStep}
      onNext={handleNext}
      onBack={handleBack}
      onSkip={handleSkip}
      onComplete={handleComplete}
      isFirstStep={activeStep === 0}
      isLastStep={activeStep === steps.length - 1}
    >
      <AdminOnboardingSteps step={activeStep} />
    </OnboardingWizard>
  );
};
