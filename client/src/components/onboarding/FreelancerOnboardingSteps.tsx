import { Box, Typography, TextField, Chip, Button } from '@mui/material';
import { useState } from 'react';

interface FreelancerOnboardingStepsProps {
  step: number;
  data: any;
  onChange: (data: any) => void;
}

export const FreelancerOnboardingSteps = ({ step, data, onChange }: FreelancerOnboardingStepsProps) => {
  const [skillInput, setSkillInput] = useState('');

  const handleAddSkill = () => {
    if (skillInput.trim() && !data.skills?.includes(skillInput.trim())) {
      onChange({
        ...data,
        skills: [...(data.skills || []), skillInput.trim()],
      });
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    onChange({
      ...data,
      skills: data.skills.filter((s: string) => s !== skill),
    });
  };

  switch (step) {
    case 0:
      return (
        <Box>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Welcome to TalentHive!
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Let's set up your freelancer profile. This will help clients find and hire you for projects.
          </Typography>
          <TextField
            fullWidth
            label="Professional Title"
            placeholder="e.g., Full Stack Developer, Graphic Designer"
            value={data.title || ''}
            onChange={(e) => onChange({ ...data, title: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Hourly Rate (USD)"
            type="number"
            placeholder="50"
            value={data.hourlyRate || ''}
            onChange={(e) => onChange({ ...data, hourlyRate: e.target.value })}
          />
        </Box>
      );

    case 1:
      return (
        <Box>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Add Your Skills
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            List your key skills to help clients understand your expertise.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              label="Add a skill"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
            />
            <Button variant="contained" onClick={handleAddSkill}>
              Add
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {data.skills?.map((skill: string) => (
              <Chip
                key={skill}
                label={skill}
                onDelete={() => handleRemoveSkill(skill)}
              />
            ))}
          </Box>
        </Box>
      );

    case 2:
      return (
        <Box>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Tell Us About Yourself
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Write a brief bio that highlights your experience and what makes you unique.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={6}
            label="Professional Bio"
            placeholder="Describe your experience, expertise, and what you can offer to clients..."
            value={data.bio || ''}
            onChange={(e) => onChange({ ...data, bio: e.target.value })}
          />
        </Box>
      );

    default:
      return null;
  }
};
