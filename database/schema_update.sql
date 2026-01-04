-- =====================================================
-- BENINFREELANCE - MISE À JOUR DU SCHÉMA
-- =====================================================
-- Version: 2.1.0
-- Date: 2025-01-04
-- Description: Ajout des tables pour profil freelance amélioré et filtrage projets
-- =====================================================

-- Activer les extensions nécessaires (IF NOT EXISTS)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. MISE À JOUR TABLE USERS - Champs profil freelance
-- =====================================================

-- Ajouter les nouveaux champs pour le profil freelance
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_account_type VARCHAR(20) DEFAULT 'freelance' CHECK (user_account_type IN ('freelance', 'agence'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS specialty VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS presentation TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_full_name BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cover_banner TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS availability_status VARCHAR(20) DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'unavailable'));

-- =====================================================
-- 2. TABLE FREELANCE_SKILLS - Compétences des freelances
-- =====================================================

CREATE TABLE IF NOT EXISTS freelance_skills (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, skill_name)
);

CREATE INDEX IF NOT EXISTS idx_freelance_skills_user_id ON freelance_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_freelance_skills_name ON freelance_skills(skill_name);

-- =====================================================
-- 3. TABLE SPECIALTIES - Liste des spécialités
-- =====================================================

CREATE TABLE IF NOT EXISTS specialties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category_id INTEGER REFERENCES categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insérer les spécialités par défaut
INSERT INTO specialties (name, is_active) VALUES
('Développeur full-stack', TRUE),
('Développeur front-end', TRUE),
('Développeur back-end', TRUE),
('Designer UI/UX', TRUE),
('Designer graphique', TRUE),
('Rédacteur web', TRUE),
('Community manager', TRUE),
('Expert SEO', TRUE),
('Développeur mobile', TRUE),
('Chef de projet', TRUE),
('Consultant marketing', TRUE),
('Traducteur', TRUE),
('Monteur vidéo', TRUE),
('Photographe', TRUE),
('Illustrateur', TRUE),
('Data analyst', TRUE),
('Expert WordPress', TRUE),
('Expert e-commerce', TRUE)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 4. TABLE PROJECT_VIEWS - Vues des projets
-- =====================================================

CREATE TABLE IF NOT EXISTS project_views (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_views_project_id ON project_views(project_id);

-- =====================================================
-- 5. TABLE PROJECT_BOOKMARKS - Projets sauvegardés
-- =====================================================

CREATE TABLE IF NOT EXISTS project_bookmarks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_project_bookmarks_user_id ON project_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_project_bookmarks_project_id ON project_bookmarks(project_id);

-- =====================================================
-- 6. MISE À JOUR TABLE PROJECTS - Champs supplémentaires
-- =====================================================

ALTER TABLE projects ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS offers_count INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS interactions_count INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS freelancer_id INTEGER REFERENCES users(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget_type VARCHAR(20) DEFAULT 'fixed' CHECK (budget_type IN ('fixed', 'hourly', 'quote'));

-- =====================================================
-- 7. TABLE PROJECT_SKILLS - Compétences requises par projet
-- =====================================================

CREATE TABLE IF NOT EXISTS project_skills (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, skill_name)
);

CREATE INDEX IF NOT EXISTS idx_project_skills_project_id ON project_skills(project_id);
CREATE INDEX IF NOT EXISTS idx_project_skills_name ON project_skills(skill_name);

-- =====================================================
-- 8. TABLE USER_ALERTS - Alertes email pour compétences
-- =====================================================

CREATE TABLE IF NOT EXISTS user_alerts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, skill_name)
);

CREATE INDEX IF NOT EXISTS idx_user_alerts_user_id ON user_alerts(user_id);

-- =====================================================
-- 9. FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour incrémenter les vues de projet
CREATE OR REPLACE FUNCTION increment_project_views(p_project_id INTEGER, p_user_id INTEGER DEFAULT NULL, p_ip VARCHAR DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    -- Enregistrer la vue
    INSERT INTO project_views (project_id, user_id, ip_address)
    VALUES (p_project_id, p_user_id, p_ip);
    
    -- Mettre à jour le compteur
    UPDATE projects SET views_count = views_count + 1 WHERE id = p_project_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour incrémenter les vues de profil
CREATE OR REPLACE FUNCTION increment_profile_views(p_user_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE users SET profile_views = profile_views + 1 WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. ROW LEVEL SECURITY (RLS) pour nouvelles tables
-- =====================================================

ALTER TABLE freelance_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_alerts ENABLE ROW LEVEL SECURITY;

-- Politiques pour freelance_skills
DO $$ BEGIN
    CREATE POLICY "Anyone can view freelance skills" ON freelance_skills FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can manage own skills" ON freelance_skills FOR ALL USING (
        user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Politiques pour project_bookmarks
DO $$ BEGIN
    CREATE POLICY "Users can view own bookmarks" ON project_bookmarks FOR SELECT USING (
        user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can manage own bookmarks" ON project_bookmarks FOR ALL USING (
        user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Politiques pour user_alerts
DO $$ BEGIN
    CREATE POLICY "Users can view own alerts" ON user_alerts FOR SELECT USING (
        user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can manage own alerts" ON user_alerts FOR ALL USING (
        user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- FIN DE LA MISE À JOUR
-- =====================================================
