/**
 * Unit tests for aiChatService.js
 * Tests core functionality without requiring database or Ollama
 */

const {
  buildSystemPrompt,
  detectUrgency,
  generateFollowUpQuestions,
} = require('../Services/aiChatService');

describe('aiChatService Unit Tests', () => {
  describe('buildSystemPrompt', () => {
    test('should include all medical context fields', () => {
      const context = {
        age: 45,
        gender: 'Male',
        bloodType: 'O+',
        chronicConditions: ['Diabetes', 'Hypertension'],
        allergies: ['Penicillin'],
        currentMedications: [{ name: 'Metformin' }, { name: 'Lisinopril' }],
        recentVitals: [{ blood_sugar: 120, blood_pressure_systolic: 130 }],
      };

      const prompt = buildSystemPrompt(context);

      expect(prompt).toContain('Age: 45');
      expect(prompt).toContain('Gender: Male');
      expect(prompt).toContain('Blood Type: O+');
      expect(prompt).toContain('Diabetes, Hypertension');
      expect(prompt).toContain('Penicillin');
      expect(prompt).toContain('Metformin, Lisinopril');
    });

    test('should handle missing context fields gracefully', () => {
      const context = {};
      const prompt = buildSystemPrompt(context);

      expect(prompt).toContain('Age: Unknown');
      expect(prompt).toContain('Gender: Unknown');
      expect(prompt).toContain('Blood Type: Unknown');
      expect(prompt).toContain('Chronic Conditions: None');
      expect(prompt).toContain('Allergies: None');
    });
  });

  describe('detectUrgency', () => {
    test('should detect emergency from Arabic keywords', () => {
      const message = 'أعاني من ألم شديد في الصدر';
      const aiResponse = 'يجب عليك الذهاب للطوارئ';
      const context = {};

      const urgency = detectUrgency(message, aiResponse, context);

      expect(urgency).toBe('emergency');
    });

    test('should detect emergency from English keywords', () => {
      const message = "I have severe chest pain and can't breathe";
      const aiResponse = 'This is serious';
      const context = {};

      const urgency = detectUrgency(message, aiResponse, context);

      expect(urgency).toBe('emergency');
    });

    test('should detect high urgency from AI response indicators', () => {
      const message = 'I have a headache';
      const aiResponse = 'This is urgent, you should see a doctor immediately';
      const context = {};

      const urgency = detectUrgency(message, aiResponse, context);

      expect(urgency).toBe('high');
    });

    test('should return medium urgency for patients with chronic conditions', () => {
      const message = 'I feel tired';
      const aiResponse = 'Rest is recommended';
      const context = { chronicConditions: ['Diabetes'] };

      const urgency = detectUrgency(message, aiResponse, context);

      expect(urgency).toBe('medium');
    });

    test('should return low urgency for normal cases', () => {
      const message = 'I have a mild headache';
      const aiResponse = 'Try rest and hydration';
      const context = {};

      const urgency = detectUrgency(message, aiResponse, context);

      expect(urgency).toBe('low');
    });
  });

  describe('generateFollowUpQuestions', () => {
    test('should ask about duration when not mentioned', () => {
      const message = 'I have a headache';
      const context = {};

      const questions = generateFollowUpQuestions(message, context);

      expect(questions.length).toBeGreaterThan(0);
      expect(questions.some(q => q.includes('How long'))).toBe(true);
    });

    test('should ask about severity when not mentioned', () => {
      const message = 'I have been having headaches for 3 days';
      const context = {};

      const questions = generateFollowUpQuestions(message, context);

      expect(questions.some(q => q.includes('severity'))).toBe(true);
    });

    test('should ask about medication when patient has current medications and space available', () => {
      const message = 'I have been having a severe headache for 3 days';
      const context = { currentMedications: [{ name: 'Aspirin' }] };

      const questions = generateFollowUpQuestions(message, context);

      // When duration and severity are already mentioned, medication question should appear
      expect(questions.some(q => q.toLowerCase().includes('medication'))).toBe(true);
    });

    test('should return maximum 3 follow-up questions', () => {
      const message = 'I feel sick';
      const context = { currentMedications: [{ name: 'Aspirin' }] };

      const questions = generateFollowUpQuestions(message, context);

      expect(questions.length).toBeLessThanOrEqual(3);
    });
  });
});
