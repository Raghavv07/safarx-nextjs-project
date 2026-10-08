const { Resend } = require('resend');

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error("RESEND_API_KEY is not defined in environment");
  process.exit(1);
}
const resend = new Resend(apiKey);

async function main() {
  console.log('Sending test email via Resend to raghavbajpai2001@gmail.com...');
  const { data, error } = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: 'raghavbajpai2001@gmail.com',
    subject: 'Welcome to SafarX - Resend Integration Test',
    html: '<p>Congrats! Your <strong>Resend email service</strong> is successfully integrated with <strong>SafarX Next.js</strong>!</p>'
  });

  if (error) {
    console.error('❌ Resend API Error:', error);
    process.exit(1);
  }

  console.log('✅ Email sent successfully! Message ID:', data.id);
}

main();
