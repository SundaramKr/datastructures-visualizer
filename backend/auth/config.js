/**
 * Replace YOUR_PROJECT_REF with your Supabase project reference
 * (Dashboard → Project Settings → General → Reference ID).
 */
window.AUTH_CONFIG = {
  projectRef: 'tuzncxsnfkcqwjnqezje',

  get baseUrl() {
    return `https://${this.projectRef}.functions.supabase.co`;
  },

  get loginUrl() {
    return `${this.baseUrl}/password-login`;
  },

  get signupUrl() {
    return `${this.baseUrl}/password-signup`;
  },
};
