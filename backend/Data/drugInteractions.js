const drugInteractions = [
  {
    drug1: 'warfarin',
    drug2: 'aspirin',
    severity: 'high',
    description: 'Combined use may increase bleeding risk and should be reviewed with a clinician.',
    recommendation: 'Consult a clinician before continuing together.'
  },
  {
    drug1: 'metformin',
    drug2: 'alcohol',
    severity: 'medium',
    description: 'Alcohol may worsen blood sugar control and should be used with caution.',
    recommendation: 'Limit alcohol and monitor blood glucose more closely.'
  },
  {
    drug1: 'lisinopril',
    drug2: 'potassium',
    severity: 'medium',
    description: 'This combination may increase potassium levels and affect kidney safety.',
    recommendation: 'Review supplementation and lab follow-up with a clinician.'
  },
  {
    drug1: 'amoxicillin',
    drug2: 'warfarin',
    severity: 'medium',
    description: 'Antibiotics may enhance the effect of warfarin and increase bleeding risk.',
    recommendation: 'Monitor for bleeding and follow medical guidance.'
  }
];

const drugAlternatives = [
  {
    originalDrug: 'ibuprofen',
    alternatives: [
      { name: 'acetaminophen', reason: 'Often used for pain with fewer GI side effects, but always check with a clinician.' }
    ]
  },
  {
    originalDrug: 'metformin',
    alternatives: [
      { name: 'glipizide', reason: 'Alternative for glucose control in some patients.' }
    ]
  },
  {
    originalDrug: 'lisinopril',
    alternatives: [
      { name: 'amlodipine', reason: 'Alternative blood pressure therapy when clinically appropriate.' }
    ]
  }
];

module.exports = { drugInteractions, drugAlternatives };
