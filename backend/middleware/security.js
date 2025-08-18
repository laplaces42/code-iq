import rateLimit from "express-rate-limit";
import helmet from "helmet";

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.github.com"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth requests per windowMs
  message: {
    error: "Too many authentication attempts",
    code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests",
    code: "RATE_LIMIT_EXCEEDED",
  },
});

// Apply rate limiting
app.use("/auth/callback", authLimiter);
app.use("/auth/refresh", authLimiter);
app.use(generalLimiter);

// Trust proxy (important for rate limiting and IP detection)
app.set("trust proxy", 1);
