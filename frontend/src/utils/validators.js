export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email) return 'Email is required'
  if (!re.test(email)) return 'Please enter a valid email'
  return null
}

export const validatePassword = (password) => {
  if (!password) return 'Password is required'
  if (password.length < 6) return 'Password must be at least 6 characters'
  return null
}

export const validateUsername = (username) => {
  if (!username) return 'Username is required'
  if (username.length < 3) return 'Username must be at least 3 characters'
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return 'Username can only contain letters, numbers, and underscores'
  }
  return null
}

export const validateProjectName = (name) => {
  if (!name) return 'Project name is required'
  if (name.length > 100) return 'Project name cannot exceed 100 characters'
  return null
}

export const validateTaskTitle = (title) => {
  if (!title) return 'Task title is required'
  if (title.length > 200) return 'Task title cannot exceed 200 characters'
  return null
}

export const validateDescription = (description) => {
  if (description && description.length > 500) {
    return 'Description cannot exceed 500 characters'
  }
  return null
}

export const validateForm = (formData, rules) => {
  const errors = {}
  
  Object.keys(rules).forEach(field => {
    const value = formData[field]
    const rule = rules[field]
    
    if (rule.required && !value) {
      errors[field] = rule.message || `${field} is required`
    }
    
    if (rule.minLength && value && value.length < rule.minLength) {
      errors[field] = rule.message || `${field} must be at least ${rule.minLength} characters`
    }
    
    if (rule.maxLength && value && value.length > rule.maxLength) {
      errors[field] = rule.message || `${field} cannot exceed ${rule.maxLength} characters`
    }
    
    if (rule.pattern && value && !rule.pattern.test(value)) {
      errors[field] = rule.message || `${field} is invalid`
    }
    
    if (rule.validate) {
      const customError = rule.validate(value, formData)
      if (customError) errors[field] = customError
    }
  })
  
  return errors
}