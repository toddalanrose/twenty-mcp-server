# Script Reference Guide

Quick reference for all Twenty MCP Server scripts and when to use them.

## Script Hierarchy

### 🚀 **Daily Use (Smart Scripts)**

**`npm run twenty:quick`** - **Main command**  
✅ Only starts what's needed  
✅ Preserves data and volumes  
✅ Fast startup (2-5 seconds)  
✅ Status-aware  

**`npm run twenty:status`** - **Check before doing anything**  
✅ Shows current state without changes  
✅ Port and health checking  
✅ Volume status  

**`npm run twenty:logs [service]`** - **Debug issues**  
✅ View logs without disruption  
✅ Filter by service (server, db, redis, worker)  
✅ Follow mode available  

### 🔧 **Setup & Configuration**

**`npm run twenty:setup`** - **First-time MCP configuration**  
✅ Creates `.env` file for MCP server  
✅ Checks Twenty connection  
✅ Provides next steps  

### 🔄 **Full Control (When Smart Scripts Aren't Enough)**

**`npm run twenty:start`** - **Force restart everything**  
⚠️ Resets volumes and containers  
⚠️ Downloads images if needed  
⚠️ Slow (2+ minutes first time)  
Use when: Containers are corrupted, need clean slate  

**`npm run twenty:stop`** - **Stop all services**  
✅ Graceful shutdown  
✅ Preserves data volumes  

### 🛠️ **Development Mode**

**`npm run twenty:dev`** - **Database-only mode**  
✅ For Twenty source code development  
✅ Just PostgreSQL + Redis containers  

## Decision Tree

```
Need Twenty CRM running?
├─ Is it your first time?
│  ├─ Yes → npm run twenty:quick
│  └─ No → npm run twenty:status first
│
├─ Having issues?
│  ├─ npm run twenty:logs
│  ├─ Still broken? → npm run twenty:start
│  └─ Working? → Continue
│
├─ Daily development?
│  ├─ npm run twenty:quick
│  └─ npm run discover
│
└─ Clean slate needed?
   └─ npm run twenty:start
```

## Command Comparison

| Command | Speed | Data Safety | Use Case |
|---------|-------|-------------|----------|
| `twenty:quick` | ⚡ Fast | ✅ Safe | Daily use, smart startup |
| `twenty:status` | ⚡ Instant | ✅ Safe | Check status |
| `twenty:logs` | ⚡ Fast | ✅ Safe | Debug issues |
| `twenty:setup` | ⚡ Fast | ✅ Safe | First-time config |
| `twenty:stop` | ⚡ Fast | ✅ Safe | Shutdown |
| `twenty:start` | 🐌 Slow | ⚠️ Resets data | Force restart |
| `twenty:dev` | 🔄 Medium | ✅ Safe | Source development |

## MCP Server Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start MCP server in development |
| `npm run discover` | Test API integration with Twenty |
| `npm run build` | Build TypeScript project |
| `npm run test` | Run test suite |
| `npm run lint` | Check code quality |

## Example Workflows

### **First Time Setup**
```bash
npm install
npm run twenty:quick      # Start Twenty
# Create workspace at http://localhost:3000
npm run twenty:setup      # Configure MCP
# Edit .env with API key
npm run discover          # Test integration
```

### **Daily Development**
```bash
npm run twenty:status     # Check current state
npm run twenty:quick      # Start if needed
npm run discover          # Test MCP server
npm run dev              # Start MCP development
```

### **Troubleshooting**
```bash
npm run twenty:status     # What's wrong?
npm run twenty:logs server # Check server logs
npm run twenty:quick      # Try smart restart
npm run twenty:start      # Force restart if needed
```

### **Clean Restart**
```bash
npm run twenty:stop       # Stop everything
npm run twenty:start      # Force fresh start
npm run twenty:setup      # Reconfigure
```

## Tips

- **Always try `twenty:quick` first** - it's smart and preserves data
- **Use `twenty:status` when unsure** - shows current state
- **`twenty:start` is the nuclear option** - resets everything
- **Check logs with `twenty:logs`** - non-destructive debugging
- **`twenty:setup` only needed once** - unless you need to reconfigure

## Integration Points

All scripts are integrated throughout the codebase:

- ✅ Error messages reference correct scripts
- ✅ Help text shows smart commands first
- ✅ Troubleshooting guides updated
- ✅ README files reference new workflow
- ✅ API discovery tool shows management commands
- ✅ Environment files have quick start commands