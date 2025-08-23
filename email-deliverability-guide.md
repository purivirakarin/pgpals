# Email Deliverability Guide for PGPals

## Current Issue Analysis
Your first email to school email wasn't delivered despite second one working fine. This suggests:

1. **Spam Filter/Security**: School email systems often have stricter security
2. **Sender Reputation**: New sending domain needs to build reputation
3. **Authentication Missing**: SPF/DKIM/DMARC records not configured

## Immediate Solutions

### 1. Set up SPF Record
Add this TXT record to your domain DNS:
```
v=spf1 include:_spf.google.com ~all
```

### 2. Set up DKIM (Domain Keys Identified Mail)
In Gmail Admin Console:
1. Go to Apps > Google Workspace > Gmail > Authenticate email
2. Generate DKIM key for your domain
3. Add the TXT record to your DNS

### 3. Set up DMARC
Add this TXT record to your domain DNS:
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
```

### 4. Update Email Configuration
In your email service, ensure:

```javascript
// In your email sending function
const mailOptions = {
  from: '"PGPals" <pgpals.pgpr@gmail.com>', // Professional sender name
  to: recipientEmail,
  subject: 'PGPals - Password Reset Request', // Clear, non-spam subject
  html: emailHtml,
  headers: {
    'X-Priority': '1',
    'X-MSMail-Priority': 'High',
    'Importance': 'high'
  }
};
```

## Email Content Best Practices

### Avoid Spam Triggers
- Don't use ALL CAPS in subject lines
- Avoid excessive punctuation (!!!)
- Include physical address in footer
- Use professional "From" name
- Keep HTML clean and simple

### Professional Subject Lines
❌ Bad: "Reset your password!!!"
✅ Good: "PGPals - Password Reset Request"

❌ Bad: "URGENT: Action Required"
✅ Good: "PGPals - Verify Your Email Address"

## Testing Tools

### 1. Check Email Authentication
Use tools like:
- MXToolbox.com SPF/DKIM checker
- Mail-tester.com (sends to test address)
- Google Postmaster Tools

### 2. Monitor Deliverability
- Set up bounce handling in your email service
- Monitor Gmail's Postmaster Tools
- Check sender reputation

## Implementation Checklist

- [ ] Configure SPF record in DNS
- [ ] Set up DKIM authentication
- [ ] Add DMARC policy
- [ ] Update email templates (see below)
- [ ] Test with multiple email providers
- [ ] Monitor delivery rates

## Why School Emails Are Stricter

1. **Security Policies**: Educational institutions have strict email security
2. **Bulk Email Filters**: Automatic filtering of automated emails
3. **Domain Reputation**: New domains are treated with suspicion
4. **Content Scanning**: Advanced content analysis for phishing

## Quick Fix Recommendations

1. **Immediate**: Update email subject lines and sender names
2. **Short-term**: Configure SPF/DKIM/DMARC records
3. **Long-term**: Monitor and improve sender reputation

## Email Provider Alternatives

If Gmail continues having issues:
- SendGrid (free tier: 100 emails/day)
- Mailgun (free tier: 1000 emails/month)
- Amazon SES (very cheap, reliable)
- Postmark (transactional email specialist)

These services have better deliverability and built-in authentication.