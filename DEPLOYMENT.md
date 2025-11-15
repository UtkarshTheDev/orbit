# Deployment Guide

This guide covers deploying the Orbit application with:
- **Backend**: Hono + Bun WebSocket server on Render
- **Frontend**: React + Vite application on Vercel

## Backend Deployment (Render)

### Prerequisites
- Render account
- Repository connected to Render

### Steps

1. **Create a new Web Service on Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your repository

2. **Configure the service**
   - **Name**: `orbit-backend`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `apps/backend`
   - **Runtime**: `Docker` or `Node`
   - **Build Command**: `bun install`
   - **Start Command**: `bun run src/index.ts`

3. **Environment Variables**
   Add these in Render's Environment section:
   ```
   NODE_ENV=production
   WS_ALLOWED_ORIGINS=https://orbit-robo.vercel.app,https://your-custom-domain.com
   ```
   
   **Note**: `PORT` is automatically set by Render - do not override it.

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically deploy your backend
   - Your backend URL will be: `https://orbit-5awh.onrender.com` (or similar)

### Verify Backend Deployment

Test the health endpoint:
```bash
curl https://orbit-5awh.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "uptime": 123.456
}
```

## Frontend Deployment (Vercel)

### Prerequisites
- Vercel account
- Repository connected to Vercel

### Steps

1. **Import Project to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import your repository

2. **Configure the project**
   - **Framework Preset**: Vite
   - **Root Directory**: `apps/tablet`
   - **Build Command**: `bun run build` or `npm run build`
   - **Output Directory**: `dist`

3. **Environment Variables**
   Add in Vercel's Environment Variables section:
   ```
   VITE_WS_URL=wss://orbit-5awh.onrender.com/ws
   ```
   
   **Note**: If not set, the app will auto-detect the WebSocket URL based on the environment.

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your frontend
   - Your frontend URL will be: `https://orbit-robo.vercel.app` (or your custom domain)

### Custom Domain (Optional)

To use a custom domain:
1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Update `WS_ALLOWED_ORIGINS` in Render to include your custom domain

## WebSocket Connection

The application uses WebSocket for real-time communication between frontend and backend.

### Connection Flow

1. Frontend connects to: `wss://orbit-5awh.onrender.com/ws`
2. Backend validates origin against `WS_ALLOWED_ORIGINS`
3. Connection established with automatic reconnection on failure

### Auto-Detection

The frontend automatically detects the correct WebSocket URL:
- **Development** (localhost): `ws://localhost:3001`
- **Production** (HTTPS): `wss://orbit-5awh.onrender.com/ws`

### Connection Status

The frontend displays connection status in the top-right corner:
- 🟢 **Green**: Connected
- 🟡 **Yellow**: Reconnecting...
- 🔴 **Red**: Disconnected

## Troubleshooting

### Backend Issues

**Problem**: WebSocket connections fail with 403 Forbidden
- **Solution**: Verify `WS_ALLOWED_ORIGINS` includes your frontend domain

**Problem**: Backend crashes on startup
- **Solution**: Check Render logs for errors. Ensure Bun is properly installed.

**Problem**: Port binding errors
- **Solution**: Ensure you're not setting `PORT` manually. Render sets it automatically.

### Frontend Issues

**Problem**: Cannot connect to WebSocket
- **Solution**: Verify `VITE_WS_URL` is set correctly or let it auto-detect

**Problem**: CORS errors
- **Solution**: Ensure frontend domain is in backend's `WS_ALLOWED_ORIGINS`

**Problem**: Connection keeps dropping
- **Solution**: Check Render logs for backend errors. Verify network stability.

### Testing Connection

Use browser console to test WebSocket connection:
```javascript
const ws = new WebSocket('wss://orbit-5awh.onrender.com/ws');
ws.onopen = () => console.log('Connected!');
ws.onmessage = (e) => console.log('Message:', e.data);
ws.onerror = (e) => console.error('Error:', e);
```

## Monitoring

### Backend Monitoring
- Render provides built-in logs and metrics
- Access logs: Render Dashboard → Your Service → Logs
- Monitor uptime and response times in Render metrics

### Frontend Monitoring
- Vercel provides analytics and logs
- Access: Vercel Dashboard → Your Project → Analytics

## Scaling

### Backend Scaling
- Render automatically scales based on your plan
- For high traffic, consider upgrading to a paid plan with more resources

### Frontend Scaling
- Vercel automatically handles CDN distribution and scaling
- No manual configuration needed

## Security

### Best Practices
1. Always use WSS (WebSocket Secure) in production
2. Keep `WS_ALLOWED_ORIGINS` restrictive - only include trusted domains
3. Use environment variables for sensitive configuration
4. Enable HTTPS on all domains
5. Regularly update dependencies

## Local Development

### Backend
```bash
cd apps/backend
bun install
bun run dev
```

Server runs at: `http://localhost:3001`
WebSocket at: `ws://localhost:3001/ws`

### Frontend
```bash
cd apps/tablet
bun install
bun run dev
```

App runs at: `http://localhost:5173`

### Testing WebSocket Locally
1. Start backend: `bun run dev` in `apps/backend`
2. Start frontend: `bun run dev` in `apps/tablet`
3. Open `http://localhost:5173?tablet=1` for tablet view
4. Open `http://localhost:5173` for phone view
5. Check browser console for connection logs

## Production URLs

- **Backend**: https://orbit-5awh.onrender.com
- **Frontend**: https://orbit-robo.vercel.app
- **WebSocket**: wss://orbit-5awh.onrender.com/ws

## Support

For issues or questions:
1. Check Render logs for backend issues
2. Check Vercel logs for frontend issues
3. Review browser console for client-side errors
4. Verify environment variables are set correctly
