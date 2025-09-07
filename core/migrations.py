# Database Migration System
# Phase 1: Core Engine Stabilization - Database Migration Fix

import os
import asyncio
import logging
import hashlib
import json
from typing import Dict, List, Optional, Any, Callable
from datetime import datetime
from pathlib import Path
from dataclasses import dataclass
import sqlite3
import aiosqlite
from enum import Enum


class MigrationStatus(Enum):
    """Migration status enumeration"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"


@dataclass
class Migration:
    """Database migration definition"""
    version: str
    name: str
    description: str
    up_sql: str
    down_sql: str
    dependencies: List[str] = None
    checksum: str = None
    
    def __post_init__(self):
        if self.dependencies is None:
            self.dependencies = []
        if self.checksum is None:
            self.checksum = self._calculate_checksum()
    
    def _calculate_checksum(self) -> str:
        """Calculate checksum for migration integrity"""
        content = f"{self.version}{self.name}{self.up_sql}{self.down_sql}"
        return hashlib.sha256(content.encode()).hexdigest()


@dataclass
class MigrationRecord:
    """Migration execution record"""
    version: str
    name: str
    status: MigrationStatus
    executed_at: datetime
    execution_time_ms: Optional[int] = None
    error_message: Optional[str] = None
    rollback_sql: Optional[str] = None
    checksum: Optional[str] = None


class DatabaseMigrator:
    """Database migration manager with versioning and rollback"""
    
    def __init__(self, db_path: str, migrations_dir: str = "migrations"):
        self.db_path = db_path
        self.migrations_dir = Path(migrations_dir)
        self.logger = logging.getLogger(__name__)
        self.migrations: Dict[str, Migration] = {}
        
        # Ensure migrations directory exists
        self.migrations_dir.mkdir(exist_ok=True)
        
        # Ensure migration tracking table exists
        asyncio.create_task(self._ensure_migration_table())
    
    async def _ensure_migration_table(self):
        """Ensure migration tracking table exists"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    version TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    status TEXT NOT NULL,
                    executed_at TIMESTAMP NOT NULL,
                    execution_time_ms INTEGER,
                    error_message TEXT,
                    rollback_sql TEXT,
                    checksum TEXT
                )
            """)
            await db.commit()
    
    def load_migrations(self):
        """Load all migration files from migrations directory"""
        self.migrations.clear()
        
        for migration_file in sorted(self.migrations_dir.glob("*.sql")):
            try:
                migration = self._parse_migration_file(migration_file)
                self.migrations[migration.version] = migration
                self.logger.info(f"📁 Loaded migration: {migration.version} - "
                               f"{migration.name}")
            except Exception as e:
                self.logger.error(f"❌ Failed to load migration {migration_file}: "
                                f"{e}")
    
    def _parse_migration_file(self, file_path: Path) -> Migration:
        """Parse a migration file"""
        content = file_path.read_text()
        
        # Extract metadata from comments
        lines = content.split('\n')
        metadata = {}
        sql_lines = []
        
        in_metadata = False
        in_up = False
        in_down = False
        up_sql = []
        down_sql = []
        
        for line in lines:
            line = line.strip()
            
            if line.startswith('-- Migration:'):
                in_metadata = True
                continue
            elif line.startswith('-- UP'):
                in_metadata = False
                in_up = True
                continue
            elif line.startswith('-- DOWN'):
                in_up = False
                in_down = True
                continue
            elif line.startswith('--') and in_metadata:
                # Parse metadata
                if ':' in line:
                    key, value = line[2:].split(':', 1)
                    metadata[key.strip().lower()] = value.strip()
            elif in_up and not line.startswith('--'):
                up_sql.append(line)
            elif in_down and not line.startswith('--'):
                down_sql.append(line)
        
        # Extract version from filename (e.g., "001_create_users.sql")
        version = file_path.stem.split('_')[0]
        
        return Migration(
            version=version,
            name=metadata.get('name', file_path.stem),
            description=metadata.get('description', ''),
            up_sql='\n'.join(up_sql),
            down_sql='\n'.join(down_sql),
            dependencies=metadata.get('dependencies', '').split(',') 
                        if metadata.get('dependencies') else []
        )
    
    async def get_migration_status(self) -> Dict[str, MigrationRecord]:
        """Get status of all migrations"""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("""
                SELECT version, name, status, executed_at, execution_time_ms,
                       error_message, rollback_sql, checksum
                FROM schema_migrations
                ORDER BY version
            """)
            rows = await cursor.fetchall()
            
            records = {}
            for row in rows:
                records[row[0]] = MigrationRecord(
                    version=row[0],
                    name=row[1],
                    status=MigrationStatus(row[2]),
                    executed_at=datetime.fromisoformat(row[3]),
                    execution_time_ms=row[4],
                    error_message=row[5],
                    rollback_sql=row[6],
                    checksum=row[7]
                )
            
            return records
    
    async def get_pending_migrations(self) -> List[Migration]:
        """Get list of pending migrations"""
        status = await self.get_migration_status()
        pending = []
        
        for version, migration in sorted(self.migrations.items()):
            if version not in status or status[version].status in [
                MigrationStatus.FAILED, MigrationStatus.ROLLED_BACK
            ]:
                # Check dependencies
                if self._check_dependencies(migration, status):
                    pending.append(migration)
        
        return pending
    
    def _check_dependencies(self, migration: Migration, 
                           status: Dict[str, MigrationRecord]) -> bool:
        """Check if migration dependencies are satisfied"""
        for dep_version in migration.dependencies:
            if (dep_version not in status or 
                status[dep_version].status != MigrationStatus.COMPLETED):
                return False
        return True
    
    async def run_migrations(self, target_version: Optional[str] = None,
                           dry_run: bool = False) -> bool:
        """Run pending migrations up to target version"""
        try:
            pending = await self.get_pending_migrations()
            
            if target_version:
                # Filter migrations up to target version
                pending = [m for m in pending if m.version <= target_version]
            
            if not pending:
                self.logger.info("✅ No pending migrations")
                return True
            
            self.logger.info(f"🚀 Running {len(pending)} migrations"
                           f"{' (DRY RUN)' if dry_run else ''}")
            
            for migration in pending:
                success = await self._execute_migration(migration, dry_run)
                if not success:
                    self.logger.error(f"❌ Migration {migration.version} failed")
                    return False
            
            self.logger.info("✅ All migrations completed successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Migration process failed: {e}")
            return False
    
    async def _execute_migration(self, migration: Migration, 
                               dry_run: bool = False) -> bool:
        """Execute a single migration"""
        start_time = datetime.now()
        
        try:
            self.logger.info(f"🔄 {'[DRY RUN] ' if dry_run else ''}"
                           f"Running migration {migration.version}: "
                           f"{migration.name}")
            
            if dry_run:
                # Validate SQL syntax without executing
                try:
                    async with aiosqlite.connect(":memory:") as db:
                        await db.execute("BEGIN")
                        for statement in migration.up_sql.split(';'):
                            if statement.strip():
                                await db.execute(statement)
                        await db.rollback()
                    
                    # Record as dry run
                    await self._record_migration_status(
                        migration, MigrationStatus.COMPLETED, 
                        execution_time_ms=0, dry_run=True
                    )
                    return True
                except Exception as e:
                    self.logger.error(f"❌ SQL validation failed: {e}")
                    return False
            
            # Execute migration
            async with aiosqlite.connect(self.db_path) as db:
                # Record migration start
                await self._record_migration_status(
                    migration, MigrationStatus.RUNNING
                )
                
                try:
                    # Begin transaction
                    await db.execute("BEGIN")
                    
                    # Execute migration SQL
                    for statement in migration.up_sql.split(';'):
                        if statement.strip():
                            await db.execute(statement)
                    
                    # Commit transaction
                    await db.commit()
                    
                    # Calculate execution time
                    execution_time = (datetime.now() - start_time).total_seconds() * 1000
                    
                    # Record success
                    await self._record_migration_status(
                        migration, MigrationStatus.COMPLETED,
                        execution_time_ms=int(execution_time)
                    )
                    
                    self.logger.info(f"✅ Migration {migration.version} completed "
                                   f"in {execution_time:.0f}ms")
                    return True
                    
                except Exception as e:
                    # Rollback transaction
                    await db.rollback()
                    
                    # Record failure
                    await self._record_migration_status(
                        migration, MigrationStatus.FAILED,
                        error_message=str(e)
                    )
                    
                    self.logger.error(f"❌ Migration {migration.version} failed: "
                                    f"{e}")
                    return False
        
        except Exception as e:
            await self._record_migration_status(
                migration, MigrationStatus.FAILED,
                error_message=str(e)
            )
            self.logger.error(f"❌ Migration {migration.version} failed: {e}")
            return False
    
    async def rollback_migration(self, version: str) -> bool:
        """Rollback a specific migration"""
        try:
            if version not in self.migrations:
                self.logger.error(f"❌ Migration {version} not found")
                return False
            
            migration = self.migrations[version]
            status = await self.get_migration_status()
            
            if (version not in status or 
                status[version].status != MigrationStatus.COMPLETED):
                self.logger.error(f"❌ Migration {version} not completed, "
                                f"cannot rollback")
                return False
            
            self.logger.info(f"🔄 Rolling back migration {version}: "
                           f"{migration.name}")
            
            async with aiosqlite.connect(self.db_path) as db:
                try:
                    await db.execute("BEGIN")
                    
                    # Execute rollback SQL
                    for statement in migration.down_sql.split(';'):
                        if statement.strip():
                            await db.execute(statement)
                    
                    await db.commit()
                    
                    # Record rollback
                    await self._record_migration_status(
                        migration, MigrationStatus.ROLLED_BACK
                    )
                    
                    self.logger.info(f"✅ Migration {version} rolled back")
                    return True
                    
                except Exception as e:
                    await db.rollback()
                    self.logger.error(f"❌ Rollback failed for {version}: {e}")
                    return False
        
        except Exception as e:
            self.logger.error(f"❌ Rollback process failed: {e}")
            return False
    
    async def _record_migration_status(self, migration: Migration,
                                     status: MigrationStatus,
                                     execution_time_ms: Optional[int] = None,
                                     error_message: Optional[str] = None,
                                     dry_run: bool = False):
        """Record migration status in database"""
        if dry_run:
            return  # Don't record dry run results in actual database
            
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                INSERT OR REPLACE INTO schema_migrations 
                (version, name, status, executed_at, execution_time_ms, 
                 error_message, rollback_sql, checksum)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                migration.version,
                migration.name,
                status.value,
                datetime.now().isoformat(),
                execution_time_ms,
                error_message,
                migration.down_sql,
                migration.checksum
            ))
            await db.commit()
    
    async def create_migration(self, name: str, description: str = "") -> str:
        """Create a new migration file template"""
        # Generate version number
        existing_versions = list(self.migrations.keys())
        if existing_versions:
            last_version = max(existing_versions)
            next_version = f"{int(last_version) + 1:03d}"
        else:
            next_version = "001"
        
        # Create migration filename
        filename = f"{next_version}_{name}.sql"
        file_path = self.migrations_dir / filename
        
        # Create migration template
        template = f"""-- Migration: {next_version}_{name}
-- Name: {name}
-- Description: {description}
-- Dependencies: 

-- UP
-- Add your migration SQL here


-- DOWN
-- Add your rollback SQL here

"""
        
        file_path.write_text(template)
        self.logger.info(f"📝 Created migration file: {filename}")
        
        return str(file_path)
    
    async def validate_migrations(self) -> Dict[str, Any]:
        """Validate all migrations for consistency"""
        validation_results = {
            "valid": True,
            "errors": [],
            "warnings": []
        }
        
        try:
            status = await self.get_migration_status()
            
            for version, migration in self.migrations.items():
                # Check checksum consistency
                if version in status:
                    recorded_checksum = status[version].checksum
                    if (recorded_checksum and 
                        recorded_checksum != migration.checksum):
                        validation_results["errors"].append(
                            f"Checksum mismatch for migration {version}"
                        )
                        validation_results["valid"] = False
                
                # Validate SQL syntax
                try:
                    async with aiosqlite.connect(":memory:") as db:
                        for statement in migration.up_sql.split(';'):
                            if statement.strip():
                                await db.execute(statement)
                except Exception as e:
                    validation_results["errors"].append(
                        f"Invalid UP SQL in migration {version}: {e}"
                    )
                    validation_results["valid"] = False
                
                try:
                    async with aiosqlite.connect(":memory:") as db:
                        for statement in migration.down_sql.split(';'):
                            if statement.strip():
                                await db.execute(statement)
                except Exception as e:
                    validation_results["warnings"].append(
                        f"Invalid DOWN SQL in migration {version}: {e}"
                    )
            
            return validation_results
            
        except Exception as e:
            validation_results["valid"] = False
            validation_results["errors"].append(f"Validation failed: {e}")
            return validation_results
    
    async def get_migration_history(self) -> List[Dict[str, Any]]:
        """Get complete migration history"""
        status = await self.get_migration_status()
        history = []
        
        for version in sorted(self.migrations.keys()):
            migration = self.migrations[version]
            record = status.get(version)
            
            history.append({
                "version": version,
                "name": migration.name,
                "description": migration.description,
                "status": record.status.value if record else "pending",
                "executed_at": record.executed_at.isoformat() if record 
                             and record.executed_at else None,
                "execution_time_ms": record.execution_time_ms if record else None,
                "has_rollback": bool(migration.down_sql.strip())
            })
        
        return history


# Initialize migrator instance
migrator: Optional[DatabaseMigrator] = None


def initialize_migrations(db_path: str, migrations_dir: str = "migrations"):
    """Initialize the global migration system"""
    global migrator
    migrator = DatabaseMigrator(db_path, migrations_dir)
    migrator.load_migrations()
    return migrator


async def run_pending_migrations(target_version: Optional[str] = None,
                               dry_run: bool = False) -> bool:
    """Run pending migrations using global migrator"""
    if not migrator:
        raise RuntimeError("Migration system not initialized. "
                         "Call initialize_migrations() first.")
    
    return await migrator.run_migrations(target_version, dry_run)


async def create_migration(name: str, description: str = "") -> str:
    """Create new migration using global migrator"""
    if not migrator:
        raise RuntimeError("Migration system not initialized.")
    
    return await migrator.create_migration(name, description)


# Create logger instance
logger = logging.getLogger(__name__)
