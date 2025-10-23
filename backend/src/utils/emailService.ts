import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// 验证必需的环境变量
const requiredEmailEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
const missingEmailEnvVars = requiredEmailEnvVars.filter(varName => !process.env[varName]);

if (missingEmailEnvVars.length > 0) {
  console.warn(`⚠️  警告: 缺少邮件服务环境变量: ${missingEmailEnvVars.join(', ')}`);
  console.warn('   邮件功能将无法使用，请在 .env 文件中配置 SMTP 相关变量');
}

// 邮件配置
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST!, // SMTP 服务器
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true, // 使用 SSL
  auth: {
    user: process.env.SMTP_USER!, // 发件人邮箱
    pass: process.env.SMTP_PASS!, // 授权码(不是邮箱密码!)
  },
  // 添加超时设置，避免长时间挂起
  connectionTimeout: 10000, // 连接超时 10秒
  greetingTimeout: 10000,   // 握手超时 10秒
  socketTimeout: 10000       // Socket超时 10秒
};

// 创建邮件传输对象
let transporter: Transporter | null = null;

/**
 * 获取邮件传输器
 */
export const getMailTransporter = (): Transporter => {
  if (!transporter) {
    transporter = nodemailer.createTransport(EMAIL_CONFIG);
  }
  return transporter;
};

/**
 * 发送验证码邮件
 * @param to 收件人邮箱
 * @param code 验证码
 * @param type 邮件类型: register | reset-password
 */
export const sendVerificationEmail = async (
  to: string,
  code: string,
  type: 'register' | 'reset-password' = 'register'
): Promise<boolean> => {
  try {
    // 检查环境变量是否配置
    if (missingEmailEnvVars.length > 0) {
      console.error('❌ SMTP未配置，无法发送邮件。缺少环境变量:', missingEmailEnvVars.join(', '));
      return false;
    }

    const mailer = getMailTransporter();

    const typeTexts = {
      register: {
        subject: '【校园交易平台】注册验证码',
        title: '欢迎注册校园交易平台',
        desc: '您正在注册校园交易平台账号,您的验证码是:'
      },
      'reset-password': {
        subject: '【校园交易平台】找回密码验证码',
        title: '找回密码验证',
        desc: '您正在重置密码,您的验证码是:'
      }
    };

    const text = typeTexts[type];

    const mailOptions = {
      from: `"校园交易平台" <${EMAIL_CONFIG.auth.user}>`,
      to,
      subject: text.subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 40px 30px; }
            .code-box { background: #f8f9ff; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
            .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace; }
            .tips { color: #666; font-size: 14px; line-height: 1.6; margin-top: 20px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${text.title}</h1>
            </div>
            <div class="content">
              <p style="font-size: 16px; color: #333;">您好!</p>
              <p style="font-size: 14px; color: #666;">${text.desc}</p>
              
              <div class="code-box">
                <div class="code">${code}</div>
              </div>
              
              <div class="tips">
                <p>⏰ 验证码有效期为 <strong>5分钟</strong>,请尽快使用。</p>
                <p>🔒 为了您的账号安全,请勿将验证码透露给他人。</p>
                <p>❓ 如果这不是您的操作,请忽略此邮件。</p>
              </div>
            </div>
            <div class="footer">
              <p>这是一封系统自动发送的邮件,请勿直接回复。</p>
              <p>© 2025 校园交易平台 - 让闲置流动起来</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    // 使用 Promise.race 确保最多等待 15 秒
    const sendMailPromise = mailer.sendMail(mailOptions);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('邮件发送超时(15秒)')), 15000);
    });

    const info = await Promise.race([sendMailPromise, timeoutPromise]);
    console.log('✅ 邮件发送成功:', info.messageId);
    return true;
  } catch (error: any) {
    console.error('❌ 邮件发送失败:', error.message || error);
    
    // 记录详细错误信息，帮助调试
    if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKET') {
      console.error('   错误类型: 连接超时，请检查 SMTP 服务器配置');
    } else if (error.code === 'EAUTH') {
      console.error('   错误类型: 认证失败，请检查 SMTP_USER 和 SMTP_PASS');
    } else if (error.responseCode === 535) {
      console.error('   错误类型: 登录失败，SMTP_PASS 应该是授权码，不是邮箱密码');
    }
    
    return false;
  }
};

/**
 * 验证邮箱配置是否正确
 */
export const verifyEmailConfig = async (): Promise<boolean> => {
  try {
    const mailer = getMailTransporter();
    await mailer.verify();
    console.log('✅ 邮件服务配置正确');
    return true;
  } catch (error) {
    console.error('❌ 邮件服务配置错误:', error);
    return false;
  }
};
