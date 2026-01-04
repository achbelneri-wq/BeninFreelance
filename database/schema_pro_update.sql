-- =====================================================
-- BENINFREELANCE - MISE À JOUR PRO
-- =====================================================
-- Version: 3.0.0
-- Date: 2026-01-04
-- Description: Fonctionnalités professionnelles niveau Codeur.com
-- =====================================================

-- =====================================================
-- 1. PORTFOLIO - Réalisations des freelances
-- =====================================================

CREATE TABLE IF NOT EXISTS portfolio_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    client_name VARCHAR(255),
    project_url VARCHAR(500),
    completion_date DATE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portfolio_images (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES portfolio_items(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption VARCHAR(255),
    is_cover BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portfolio_technologies (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES portfolio_items(id) ON DELETE CASCADE,
    technology_name VARCHAR(100) NOT NULL,
    UNIQUE(portfolio_id, technology_name)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_user ON portfolio_items(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_category ON portfolio_items(category);

-- =====================================================
-- 2. CERTIFICATIONS ET DIPLÔMES
-- =====================================================

CREATE TABLE IF NOT EXISTS certifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    issuer VARCHAR(255) NOT NULL,
    issue_date DATE,
    expiry_date DATE,
    credential_id VARCHAR(255),
    credential_url VARCHAR(500),
    document_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    verified_by INTEGER REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS education (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institution VARCHAR(255) NOT NULL,
    degree VARCHAR(255),
    field_of_study VARCHAR(255),
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    document_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_experience (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certifications_user ON certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_education_user ON education(user_id);
CREATE INDEX IF NOT EXISTS idx_work_experience_user ON work_experience(user_id);

-- =====================================================
-- 3. DISPONIBILITÉ ET CALENDRIER
-- =====================================================

CREATE TABLE IF NOT EXISTS availability_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_available BOOLEAN DEFAULT TRUE,
    availability_status VARCHAR(20) DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'away', 'unavailable')),
    hours_per_week INTEGER DEFAULT 40,
    preferred_project_size VARCHAR(20) DEFAULT 'any' CHECK (preferred_project_size IN ('small', 'medium', 'large', 'any')),
    min_project_budget DECIMAL(12,2),
    max_concurrent_projects INTEGER DEFAULT 3,
    notice_period_days INTEGER DEFAULT 0,
    timezone VARCHAR(50) DEFAULT 'Africa/Porto-Novo',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS availability_schedule (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, day_of_week)
);

CREATE TABLE IF NOT EXISTS unavailable_dates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. LANGUES ET COMPÉTENCES AVANCÉES
-- =====================================================

CREATE TABLE IF NOT EXISTS user_languages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language VARCHAR(100) NOT NULL,
    proficiency_level VARCHAR(20) NOT NULL CHECK (proficiency_level IN ('basic', 'conversational', 'fluent', 'native')),
    is_primary BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, language)
);

CREATE TABLE IF NOT EXISTS skill_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    parent_id INTEGER REFERENCES skill_categories(id),
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS skills_master (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category_id INTEGER REFERENCES skill_categories(id),
    is_verified BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_skills_detailed (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES skills_master(id),
    skill_name VARCHAR(100) NOT NULL,
    proficiency_level INTEGER DEFAULT 3 CHECK (proficiency_level >= 1 AND proficiency_level <= 5),
    years_experience DECIMAL(3,1),
    is_primary BOOLEAN DEFAULT FALSE,
    endorsements_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, skill_name)
);

CREATE TABLE IF NOT EXISTS skill_endorsements (
    id SERIAL PRIMARY KEY,
    skill_id INTEGER NOT NULL REFERENCES user_skills_detailed(id) ON DELETE CASCADE,
    endorser_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(skill_id, endorser_id)
);

-- =====================================================
-- 5. BADGES ET RÉCOMPENSES
-- =====================================================

CREATE TABLE IF NOT EXISTS badges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100),
    color VARCHAR(20),
    criteria TEXT,
    points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_badges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMPTZ DEFAULT NOW(),
    awarded_reason TEXT,
    UNIQUE(user_id, badge_id)
);

-- Insérer les badges par défaut
INSERT INTO badges (name, slug, description, icon, color, criteria, points) VALUES
('Nouveau', 'nouveau', 'Nouveau membre de la plateforme', 'sparkles', '#5C6B4A', 'Inscription récente', 0),
('Vérifié', 'verifie', 'Identité vérifiée par notre équipe', 'shield-check', '#C75B39', 'KYC validé', 50),
('Top Freelance', 'top-freelance', 'Freelance avec excellentes performances', 'trophy', '#D4AF37', 'Note > 4.8, 10+ projets', 200),
('Expert', 'expert', 'Expert reconnu dans son domaine', 'award', '#C75B39', '20+ projets, 50+ avis', 300),
('Réponse Rapide', 'reponse-rapide', 'Répond en moins de 2 heures', 'zap', '#5C6B4A', 'Temps réponse < 2h', 25),
('Client Fidèle', 'client-fidele', 'Client avec plusieurs projets réussis', 'heart', '#C75B39', '5+ projets commandés', 100),
('Ambassadeur', 'ambassadeur', 'Ambassadeur de la communauté béninoise', 'flag', '#D4AF37', 'Contribution exceptionnelle', 500)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 6. PROPOSITIONS AVANCÉES AVEC JALONS
-- =====================================================

ALTER TABLE proposals ADD COLUMN IF NOT EXISTS template_id INTEGER;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS validity_days INTEGER DEFAULT 7;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS questions_answered JSONB DEFAULT '[]';
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS proposal_templates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    cover_letter_template TEXT,
    default_delivery_time INTEGER,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proposal_milestones (
    id SERIAL PRIMARY KEY,
    proposal_id INTEGER NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(12,2) NOT NULL,
    percentage DECIMAL(5,2),
    due_days INTEGER,
    sort_order INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'submitted', 'approved', 'revision', 'completed')),
    started_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    deliverables TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_questions (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    is_required BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proposal_answers (
    id SERIAL PRIMARY KEY,
    proposal_id INTEGER NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES project_questions(id) ON DELETE CASCADE,
    answer TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(proposal_id, question_id)
);

CREATE TABLE IF NOT EXISTS counter_proposals (
    id SERIAL PRIMARY KEY,
    proposal_id INTEGER NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    proposed_by INTEGER NOT NULL REFERENCES users(id),
    proposed_price DECIMAL(12,2) NOT NULL,
    proposed_delivery_time INTEGER NOT NULL,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proposal_milestones_proposal ON proposal_milestones(proposal_id);
CREATE INDEX IF NOT EXISTS idx_project_questions_project ON project_questions(project_id);

-- =====================================================
-- 7. CONTRATS ET FACTURATION
-- =====================================================

CREATE TABLE IF NOT EXISTS contracts (
    id SERIAL PRIMARY KEY,
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    order_id INTEGER UNIQUE REFERENCES orders(id),
    project_id INTEGER REFERENCES projects(id),
    client_id INTEGER NOT NULL REFERENCES users(id),
    freelancer_id INTEGER NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    total_amount DECIMAL(12,2) NOT NULL,
    start_date DATE,
    end_date DATE,
    terms TEXT,
    client_signature TEXT,
    client_signed_at TIMESTAMPTZ,
    freelancer_signature TEXT,
    freelancer_signed_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_signatures', 'active', 'completed', 'cancelled', 'disputed')),
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    order_id INTEGER REFERENCES orders(id),
    contract_id INTEGER REFERENCES contracts(id),
    milestone_id INTEGER REFERENCES proposal_milestones(id),
    from_user_id INTEGER NOT NULL REFERENCES users(id),
    to_user_id INTEGER NOT NULL REFERENCES users(id),
    subtotal DECIMAL(12,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'XOF',
    due_date DATE,
    paid_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled')),
    notes TEXT,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description VARCHAR(500) NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    sort_order INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_contracts_client ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_freelancer ON contracts(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_from ON invoices(from_user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_to ON invoices(to_user_id);

-- =====================================================
-- 8. AVIS DÉTAILLÉS
-- =====================================================

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS expertise_rating INTEGER CHECK (expertise_rating >= 1 AND expertise_rating <= 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS would_recommend BOOLEAN DEFAULT TRUE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS project_type VARCHAR(100);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS project_budget_range VARCHAR(50);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT TRUE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reported_count INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS review_helpful (
    id SERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(review_id, user_id)
);

CREATE TABLE IF NOT EXISTS review_reports (
    id SERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    reporter_id INTEGER NOT NULL REFERENCES users(id),
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'fake', 'harassment', 'other')),
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'removed', 'dismissed')),
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 9. ALERTES ET NOTIFICATIONS AVANCÉES
-- =====================================================

CREATE TABLE IF NOT EXISTS alert_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_new_projects BOOLEAN DEFAULT TRUE,
    email_new_messages BOOLEAN DEFAULT TRUE,
    email_proposal_updates BOOLEAN DEFAULT TRUE,
    email_order_updates BOOLEAN DEFAULT TRUE,
    email_weekly_summary BOOLEAN DEFAULT TRUE,
    email_marketing BOOLEAN DEFAULT FALSE,
    push_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    sms_phone VARCHAR(50),
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_alerts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    keywords TEXT[] DEFAULT '{}',
    categories TEXT[] DEFAULT '{}',
    skills TEXT[] DEFAULT '{}',
    min_budget DECIMAL(12,2),
    max_budget DECIMAL(12,2),
    locations TEXT[] DEFAULT '{}',
    frequency VARCHAR(20) DEFAULT 'instant' CHECK (frequency IN ('instant', 'daily', 'weekly')),
    is_active BOOLEAN DEFAULT TRUE,
    last_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 10. STATISTIQUES FREELANCE
-- =====================================================

CREATE TABLE IF NOT EXISTS freelancer_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_projects INTEGER DEFAULT 0,
    completed_projects INTEGER DEFAULT 0,
    ongoing_projects INTEGER DEFAULT 0,
    total_earnings DECIMAL(12,2) DEFAULT 0,
    this_month_earnings DECIMAL(12,2) DEFAULT 0,
    avg_project_value DECIMAL(12,2) DEFAULT 0,
    repeat_client_rate DECIMAL(5,2) DEFAULT 0,
    on_time_delivery_rate DECIMAL(5,2) DEFAULT 100,
    response_rate DECIMAL(5,2) DEFAULT 100,
    avg_response_time_hours DECIMAL(5,2) DEFAULT 0,
    profile_views_total INTEGER DEFAULT 0,
    profile_views_this_month INTEGER DEFAULT 0,
    proposal_success_rate DECIMAL(5,2) DEFAULT 0,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 11. VILLES BÉNINOISES
-- =====================================================

CREATE TABLE IF NOT EXISTS benin_cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    is_major BOOLEAN DEFAULT FALSE,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    population INTEGER,
    sort_order INTEGER DEFAULT 0
);

INSERT INTO benin_cities (name, department, is_major, sort_order) VALUES
('Cotonou', 'Littoral', TRUE, 1),
('Porto-Novo', 'Ouémé', TRUE, 2),
('Parakou', 'Borgou', TRUE, 3),
('Abomey-Calavi', 'Atlantique', TRUE, 4),
('Djougou', 'Donga', FALSE, 5),
('Bohicon', 'Zou', FALSE, 6),
('Natitingou', 'Atacora', FALSE, 7),
('Lokossa', 'Mono', FALSE, 8),
('Ouidah', 'Atlantique', FALSE, 9),
('Kandi', 'Alibori', FALSE, 10),
('Abomey', 'Zou', FALSE, 11),
('Malanville', 'Alibori', FALSE, 12),
('Pobè', 'Plateau', FALSE, 13),
('Savalou', 'Collines', FALSE, 14),
('Sèmè-Kpodji', 'Ouémé', FALSE, 15)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 12. PROGRAMME DE PARRAINAGE
-- =====================================================

CREATE TABLE IF NOT EXISTS referral_codes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(20) UNIQUE NOT NULL,
    total_referrals INTEGER DEFAULT 0,
    successful_referrals INTEGER DEFAULT 0,
    total_earned DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER NOT NULL REFERENCES users(id),
    referred_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
    referral_code VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'registered', 'qualified', 'rewarded')),
    reward_amount DECIMAL(12,2),
    rewarded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 13. MISE À JOUR TABLE USERS
-- =====================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS headline VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS tagline VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS portfolio_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS video_intro_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS member_since DATE DEFAULT CURRENT_DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_proposal_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS search_visibility BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completion INTEGER DEFAULT 0;

-- =====================================================
-- 14. MISE À JOUR TABLE PROJECTS
-- =====================================================

ALTER TABLE projects ADD COLUMN IF NOT EXISTS urgency VARCHAR(20) DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'urgent'));
ALTER TABLE projects ADD COLUMN IF NOT EXISTS experience_level VARCHAR(20) DEFAULT 'any' CHECK (experience_level IN ('entry', 'intermediate', 'expert', 'any'));
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_length VARCHAR(20) DEFAULT 'short' CHECK (project_length IN ('short', 'medium', 'long', 'ongoing'));
ALTER TABLE projects ADD COLUMN IF NOT EXISTS location_preference VARCHAR(20) DEFAULT 'remote' CHECK (location_preference IN ('remote', 'local', 'hybrid', 'any'));
ALTER TABLE projects ADD COLUMN IF NOT EXISTS preferred_city VARCHAR(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS invited_freelancers INTEGER[] DEFAULT '{}';

-- =====================================================
-- 15. FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour calculer le score de complétion du profil
CREATE OR REPLACE FUNCTION calculate_profile_completion(p_user_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    completion INTEGER := 0;
    user_record RECORD;
BEGIN
    SELECT * INTO user_record FROM users WHERE id = p_user_id;
    
    IF user_record.name IS NOT NULL AND user_record.name != '' THEN completion := completion + 10; END IF;
    IF user_record.bio IS NOT NULL AND LENGTH(user_record.bio) > 50 THEN completion := completion + 15; END IF;
    IF user_record.avatar IS NOT NULL THEN completion := completion + 10; END IF;
    IF user_record.phone IS NOT NULL THEN completion := completion + 5; END IF;
    IF user_record.city IS NOT NULL THEN completion := completion + 5; END IF;
    IF user_record.skills IS NOT NULL AND array_length(user_record.skills, 1) > 0 THEN completion := completion + 15; END IF;
    IF user_record.headline IS NOT NULL THEN completion := completion + 10; END IF;
    IF user_record.hourly_rate IS NOT NULL THEN completion := completion + 5; END IF;
    
    IF EXISTS (SELECT 1 FROM portfolio_items WHERE user_id = p_user_id LIMIT 1) THEN completion := completion + 15; END IF;
    IF EXISTS (SELECT 1 FROM certifications WHERE user_id = p_user_id LIMIT 1) THEN completion := completion + 5; END IF;
    IF EXISTS (SELECT 1 FROM work_experience WHERE user_id = p_user_id LIMIT 1) THEN completion := completion + 5; END IF;
    
    UPDATE users SET profile_completion = completion WHERE id = p_user_id;
    
    RETURN completion;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour les stats freelance
CREATE OR REPLACE FUNCTION update_freelancer_stats(p_user_id INTEGER)
RETURNS VOID AS $$
BEGIN
    INSERT INTO freelancer_stats (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO UPDATE SET
        total_projects = (SELECT COUNT(*) FROM orders WHERE seller_id = p_user_id),
        completed_projects = (SELECT COUNT(*) FROM orders WHERE seller_id = p_user_id AND status = 'completed'),
        ongoing_projects = (SELECT COUNT(*) FROM orders WHERE seller_id = p_user_id AND status IN ('pending', 'in_progress')),
        total_earnings = (SELECT COALESCE(SUM(seller_amount), 0) FROM orders WHERE seller_id = p_user_id AND status = 'completed'),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Générer un code de parrainage unique
CREATE OR REPLACE FUNCTION generate_referral_code(p_user_id INTEGER)
RETURNS VARCHAR AS $$
DECLARE
    new_code VARCHAR(20);
    user_name VARCHAR;
BEGIN
    SELECT UPPER(SUBSTRING(name FROM 1 FOR 3)) INTO user_name FROM users WHERE id = p_user_id;
    new_code := COALESCE(user_name, 'BEN') || LPAD(p_user_id::TEXT, 4, '0') || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 3));
    
    INSERT INTO referral_codes (user_id, code)
    VALUES (p_user_id, new_code)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 16. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Politiques pour portfolio
DO $$ BEGIN
    CREATE POLICY "Public can view public portfolio" ON portfolio_items FOR SELECT USING (is_public = TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can manage own portfolio" ON portfolio_items FOR ALL USING (
        user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Politiques pour certifications
DO $$ BEGIN
    CREATE POLICY "Public can view certifications" ON certifications FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can manage own certifications" ON certifications FOR ALL USING (
        user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Politiques pour contrats
DO $$ BEGIN
    CREATE POLICY "Users can view own contracts" ON contracts FOR SELECT USING (
        client_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) OR
        freelancer_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Politiques pour factures
DO $$ BEGIN
    CREATE POLICY "Users can view own invoices" ON invoices FOR SELECT USING (
        from_user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) OR
        to_user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- FIN DE LA MISE À JOUR PRO
-- =====================================================
