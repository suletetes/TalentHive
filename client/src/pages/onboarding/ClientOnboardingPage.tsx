import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { ClientOnboardingSteps } from '@/components/onboarding/ClientOnboardingSteps';
import { updateOnboardingStep, completeOnboarding, skipOnboarding } from '@/store/slices/onboardingSlice';
import { AppDispatch } from '@/store';
import toast from 'react-hot-toast';
import { apiService } from '@/services/api';

const steps = ['Company Info', 'About', 'Complete'];

export const ClientOnboardingPage = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<any>({});
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
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to skip onboarding');
    }
  };

  const handleComplete = async () => {
    try {
      // Update profile with collected data
      await apiService.put('/users/profile', {
        companyName: formData.companyName,
        location: formData.location,
        companyDescription: formData.companyDescription,
      });

      await dispatch(completeOnboarding()).unwrap();
      toast.success('Onboarding completed!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete onboarding');
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
      <ClientOnboardingSteps
        step={activeStep}
        data={formData}
        onChange={setFormData}
      />
    </OnboardingWizard>
  );
};
