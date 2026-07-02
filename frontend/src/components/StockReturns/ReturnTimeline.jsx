import React from 'react';
import { Box, Stepper, Step, StepLabel, Card, CardContent } from '@mui/material';

const STEPS = ['CREATED', 'ACKNOWLEDGED', 'PICKED_UP', 'COMPLETED'];

const ReturnTimeline = ({ currentStatus }) => {
  // Determine active step
  // Returns can also be PENDING, APPROVED, REJECTED before SUBMITTED.
  // The timeline requested by user only showed CREATED -> ACKNOWLEDGED -> PICKED_UP -> COMPLETED.
  // We'll treat PENDING/APPROVED/SUBMITTED as CREATED.
  
  let activeStep = 0;
  if (['ACKNOWLEDGED'].includes(currentStatus)) {
    activeStep = 1;
  } else if (['PICKED_UP'].includes(currentStatus)) {
    activeStep = 2;
  } else if (['COMPLETED'].includes(currentStatus)) {
    activeStep = 4; // all done
  } else if (currentStatus === 'REJECTED') {
    activeStep = -1; // Handle rejected state if needed
  }

  return (
    <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 4px 6px rgba(0,0,0,0.04)' }}>
      <CardContent sx={{ py: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </CardContent>
    </Card>
  );
};

export default ReturnTimeline;
