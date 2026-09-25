package com.example.outletmanagement.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.regex.Pattern;

public class PasswordConstraintValidator implements ConstraintValidator<ValidPassword, String> {

    // 8+ chars, uppercase, lowercase, number, symbol
    private static final String COMPLEXITY_PATTERN = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!_\\-~`|/\\\\*\"'?;:><.,\\[\\]{}()]).{8,}$";
    
    @Override
    public void initialize(ValidPassword arg0) {
    }

    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        if (password == null || password.trim().isEmpty()) {
            return false;
        }

        boolean hasComplexity = Pattern.matches(COMPLEXITY_PATTERN, password);
        
        // Predictability check:
        // No 3 consecutive identical characters (e.g., "aaa", "111")
        boolean hasRepeating = Pattern.compile("(.)\\1{2,}").matcher(password).find();
        
        // Check for common sequences
        boolean hasSequence = password.toLowerCase().contains("123") || 
                              password.toLowerCase().contains("abc") || 
                              password.toLowerCase().contains("qwe") ||
                              password.toLowerCase().contains("password");

        if (!hasComplexity || hasRepeating || hasSequence) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("Password must be at least 8 characters, contain uppercase, lowercase, number, and symbol. No common sequences or repeating characters allowed.")
                   .addConstraintViolation();
            return false;
        }
        
        return true;
    }
}
