import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { FreelancerOnboardingSteps } from '@/components/onboarding/FreelancerOnboardingSteps';
import { updateOnboardingStep, completeOnboarding, skipOnboarding } from '@/store/slices/onboardingSlice';
import { AppDispatch } from '@/store';
import toast from 'react-hot-toast';
import { apiService } from '@/services/api';

const steps = ['Profile Setup', 'Skills', 'Bio'];

export const FreelancerOnboardingPage = () => {
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
        title: formData.title,
        hourlyRate: formData.hourlyRate,
        skills: formData.skills,
        bio: formData.bio,
      });

      await dispatch(completeOnboarding()).unwrap();
      toast.success('Onboarding completed!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete onboarding');
    }
  };

  const isNextDisabled = () => {
    if (activeStep === 0) {
      return !formData.title || !formData.hourlyRate;
    }
    if (activeStep === 1) {
      return !formData.skills || formData.skills.length === 0;
    }
    return false;
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
      nextDisabled={isNextDisabled()}
    >
      <FreelancerOnboardingSteps
        step={activeStep}
        data={formData}
        onChange={setFormData}
      />
    </OnboardingWizard>
  );
};

export default FreelancerOnboardingPage;
