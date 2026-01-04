-- =====================================================
-- BENINFREELANCE - SCHÉMA DE BASE DE DONNÉES PRODUCTION
-- =====================================================
-- Version: 2.0.0
-- Date: 2025-01-03
-- Description: Schéma complet pour Supabase PostgreSQL
-- =====================================================

-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. TABLES PRINCIPALES
-- =====================================================

-- 1.1. USERS - Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    auth_id UUID UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    bio TEXT,
    phone VARCHAR(50),
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Bénin',
    avatar TEXT,
    cover_image TEXT,
    skills TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT '{"Français"}',
    is_seller BOOLEAN DEFAULT FALSE,
    user_type VARCHAR(20) DEFAULT 'client' CHECK (user_type IN ('client', 'freelance', 'both')),
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    completed_orders INTEGER DEFAULT 0,
    response_time INTEGER DEFAULT 0,
    kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'submitted', 'verified', 'rejected')),
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2. CATEGORIES - Catégories de services
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    parent_id INTEGER REFERENCES categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3. SERVICES - Services proposés par les freelances
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    price DECIMAL(12,2) NOT NULL,
    delivery_time INTEGER NOT NULL DEFAULT 7,
    revisions INTEGER DEFAULT 1,
    images TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    requirements TEXT,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'deleted')),
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.4. SERVICE_PACKAGES - Packages de services (Basic, Standard, Premium)
CREATE TABLE IF NOT EXISTS service_packages (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL CHECK (name IN ('basic', 'standard', 'premium')),
    title VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL,
    delivery_time INTEGER NOT NULL,
    revisions INTEGER DEFAULT 1,
    features TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.5. PROJECTS - Projets publiés par les clients
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    budget_min DECIMAL(12,2),
    budget_max DECIMAL(12,2),
    deadline DATE,
    skills_required TEXT[] DEFAULT '{}',
    attachments TEXT[] DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'in_progress', 'completed', 'cancelled')),
    visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'invite_only')),
    proposals_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.6. PROPOSALS - Propositions des freelances sur les projets
CREATE TABLE IF NOT EXISTS proposals (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    freelancer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cover_letter TEXT NOT NULL,
    proposed_price DECIMAL(12,2) NOT NULL,
    delivery_time INTEGER NOT NULL,
    attachments TEXT[] DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, freelancer_id)
);

-- 1.7. ORDERS - Commandes
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    service_id INTEGER REFERENCES services(id),
    project_id INTEGER REFERENCES projects(id),
    package_id INTEGER REFERENCES service_packages(id),
    buyer_id INTEGER NOT NULL REFERENCES users(id),
    seller_id INTEGER NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL,
    platform_fee DECIMAL(12,2) DEFAULT 0,
    seller_amount DECIMAL(12,2) DEFAULT 0,
    quantity INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'delivered', 'revision', 'completed', 'cancelled', 'disputed')),
    delivery_date TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    requirements TEXT,
    deliverables TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.8. ESCROW - Système d'escrow pour les paiements
CREATE TABLE IF NOT EXISTS escrow (
    id SERIAL PRIMARY KEY,
    order_id INTEGER UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    platform_fee DECIMAL(12,2) DEFAULT 0,
    seller_amount DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'held' CHECK (status IN ('held', 'released', 'refunded', 'disputed', 'partial_release')),
    held_at TIMESTAMPTZ DEFAULT NOW(),
    released_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    notes TEXT
);

-- 1.9. WALLETS - Portefeuilles utilisateurs
CREATE TABLE IF NOT EXISTS wallets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(12,2) DEFAULT 0.00,
    pending_balance DECIMAL(12,2) DEFAULT 0.00,
    total_earned DECIMAL(12,2) DEFAULT 0.00,
    total_withdrawn DECIMAL(12,2) DEFAULT 0.00,
    total_spent DECIMAL(12,2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'XOF',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.10. TRANSACTIONS - Historique des transactions
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id INTEGER REFERENCES wallets(id),
    order_id INTEGER REFERENCES orders(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'earning', 'payment', 'refund', 'fee', 'bonus')),
    amount DECIMAL(12,2) NOT NULL,
    fee DECIMAL(12,2) DEFAULT 0,
    balance_after DECIMAL(12,2),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.11. REVIEWS - Avis et évaluations
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    order_id INTEGER UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    reviewer_id INTEGER NOT NULL REFERENCES users(id),
    reviewed_id INTEGER NOT NULL REFERENCES users(id),
    service_id INTEGER REFERENCES services(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    delivery_rating INTEGER CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
    comment TEXT,
    response TEXT,
    response_at TIMESTAMPTZ,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.12. CONVERSATIONS - Conversations de messagerie
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    participant_1 INTEGER NOT NULL REFERENCES users(id),
    participant_2 INTEGER NOT NULL REFERENCES users(id),
    order_id INTEGER REFERENCES orders(id),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(participant_1, participant_2)
);

-- 1.13. MESSAGES - Messages
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    attachments TEXT[] DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.14. NOTIFICATIONS - Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    link VARCHAR(500),
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.15. FAVORITES - Services favoris
CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, service_id)
);

-- 1.16. PORTFOLIO - Portfolio des freelances
CREATE TABLE IF NOT EXISTS portfolio (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    images TEXT[] DEFAULT '{}',
    link VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.17. CERTIFICATIONS - Certifications des freelances
CREATE TABLE IF NOT EXISTS certifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    issuer VARCHAR(255),
    issue_date DATE,
    expiry_date DATE,
    credential_id VARCHAR(255),
    credential_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.18. KYC_DOCUMENTS - Documents KYC
CREATE TABLE IF NOT EXISTS kyc_documents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('id_card', 'passport', 'driver_license', 'proof_of_address', 'selfie')),
    document_url TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.19. DISPUTES - Litiges
CREATE TABLE IF NOT EXISTS disputes (
    id SERIAL PRIMARY KEY,
    order_id INTEGER UNIQUE NOT NULL REFERENCES orders(id),
    initiated_by INTEGER NOT NULL REFERENCES users(id),
    reason VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    evidence TEXT[] DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'closed')),
    resolution TEXT,
    resolved_by INTEGER REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.20. REPORTS - Signalements
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    reporter_id INTEGER NOT NULL REFERENCES users(id),
    reported_user_id INTEGER REFERENCES users(id),
    reported_service_id INTEGER REFERENCES services(id),
    reported_project_id INTEGER REFERENCES projects(id),
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. INDEX POUR OPTIMISATION
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_seller ON users(is_seller);
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(kyc_status);

CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_services_rating ON services(rating DESC);

CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);

CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- =====================================================
-- 3. FONCTIONS ET TRIGGERS
-- =====================================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Fonction pour générer un numéro de commande unique
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number := 'BF-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEW.id::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- Fonction pour créer automatiquement un wallet
CREATE OR REPLACE FUNCTION create_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO wallets (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_wallet_on_user_insert AFTER INSERT ON users FOR EACH ROW EXECUTE FUNCTION create_user_wallet();

-- Fonction pour libérer l'escrow
CREATE OR REPLACE FUNCTION release_escrow(p_order_id INTEGER)
RETURNS VOID AS $$
DECLARE
    v_escrow RECORD;
    v_order RECORD;
BEGIN
    -- Récupérer l'escrow
    SELECT * INTO v_escrow FROM escrow WHERE order_id = p_order_id AND status = 'held';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Escrow non trouvé ou déjà traité';
    END IF;

    -- Récupérer la commande
    SELECT * INTO v_order FROM orders WHERE id = p_order_id;

    -- Mettre à jour l'escrow
    UPDATE escrow SET status = 'released', released_at = NOW() WHERE id = v_escrow.id;

    -- Créditer le vendeur
    UPDATE wallets 
    SET balance = balance + v_escrow.seller_amount,
        total_earned = total_earned + v_escrow.seller_amount
    WHERE user_id = v_order.seller_id;

    -- Créer la transaction pour le vendeur
    INSERT INTO transactions (user_id, order_id, type, amount, status, description)
    VALUES (v_order.seller_id, p_order_id, 'earning', v_escrow.seller_amount, 'completed', 'Paiement commande #' || v_order.order_number);

    -- Mettre à jour la commande
    UPDATE orders SET status = 'completed', completed_at = NOW() WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour rembourser l'escrow
CREATE OR REPLACE FUNCTION refund_escrow(p_order_id INTEGER)
RETURNS VOID AS $$
DECLARE
    v_escrow RECORD;
    v_order RECORD;
BEGIN
    -- Récupérer l'escrow
    SELECT * INTO v_escrow FROM escrow WHERE order_id = p_order_id AND status = 'held';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Escrow non trouvé ou déjà traité';
    END IF;

    -- Récupérer la commande
    SELECT * INTO v_order FROM orders WHERE id = p_order_id;

    -- Mettre à jour l'escrow
    UPDATE escrow SET status = 'refunded', refunded_at = NOW() WHERE id = v_escrow.id;

    -- Rembourser l'acheteur
    UPDATE wallets 
    SET balance = balance + v_escrow.amount
    WHERE user_id = v_order.buyer_id;

    -- Créer la transaction de remboursement
    INSERT INTO transactions (user_id, order_id, type, amount, status, description)
    VALUES (v_order.buyer_id, p_order_id, 'refund', v_escrow.amount, 'completed', 'Remboursement commande #' || v_order.order_number);

    -- Mettre à jour la commande
    UPDATE orders SET status = 'cancelled' WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour les statistiques utilisateur
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
        -- Mettre à jour le nombre de commandes complétées du vendeur
        UPDATE users 
        SET completed_orders = completed_orders + 1 
        WHERE id = NEW.seller_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stats_on_order_complete 
AFTER INSERT OR UPDATE ON orders 
FOR EACH ROW 
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION update_user_stats();

-- Fonction pour mettre à jour la note moyenne
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour la note du vendeur
    UPDATE users 
    SET rating = (
        SELECT COALESCE(AVG(rating), 0) 
        FROM reviews 
        WHERE reviewed_id = NEW.reviewed_id
    ),
    total_reviews = (
        SELECT COUNT(*) 
        FROM reviews 
        WHERE reviewed_id = NEW.reviewed_id
    )
    WHERE id = NEW.reviewed_id;

    -- Mettre à jour la note du service si applicable
    IF NEW.service_id IS NOT NULL THEN
        UPDATE services 
        SET rating = (
            SELECT COALESCE(AVG(rating), 0) 
            FROM reviews 
            WHERE service_id = NEW.service_id
        ),
        total_reviews = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE service_id = NEW.service_id
        )
        WHERE id = NEW.service_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_on_review 
AFTER INSERT ON reviews 
FOR EACH ROW 
EXECUTE FUNCTION update_user_rating();

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Politiques pour users
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = auth_id);

-- Politiques pour services
CREATE POLICY "Anyone can view active services" ON services FOR SELECT USING (status = 'active');
CREATE POLICY "Sellers can manage own services" ON services FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- Politiques pour projects
CREATE POLICY "Anyone can view public projects" ON projects FOR SELECT USING (visibility = 'public' AND status = 'open');
CREATE POLICY "Clients can manage own projects" ON projects FOR ALL USING (
    client_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- Politiques pour orders
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (
    buyer_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) OR
    seller_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- Politiques pour wallets
CREATE POLICY "Users can view own wallet" ON wallets FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- Politiques pour transactions
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- Politiques pour notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- =====================================================
-- 5. DONNÉES INITIALES
-- =====================================================

-- Insérer les catégories
INSERT INTO categories (name, slug, description, icon, sort_order) VALUES
('Développement Web', 'developpement-web', 'Sites web, applications web, e-commerce', 'Code', 1),
('Design Graphique', 'design-graphique', 'Logos, flyers, branding, UI/UX', 'Palette', 2),
('Rédaction & Traduction', 'redaction', 'Articles, copywriting, traduction', 'PenTool', 3),
('Vidéo & Animation', 'video-animation', 'Montage vidéo, motion design, animation', 'Video', 4),
('Musique & Audio', 'musique-audio', 'Production musicale, voix off, podcast', 'Music', 5),
('Marketing Digital', 'marketing-digital', 'SEO, réseaux sociaux, publicité', 'Megaphone', 6),
('Business & Consulting', 'business', 'Conseil, stratégie, business plan', 'BarChart3', 7),
('Formation & Coaching', 'formation', 'Cours en ligne, mentorat, coaching', 'GraduationCap', 8),
('Photographie', 'photographie', 'Photos produits, portraits, événements', 'Camera', 9),
('Data & Analytics', 'data-analytics', 'Analyse de données, visualisation, BI', 'Database', 10),
('Applications Mobiles', 'mobile-app', 'iOS, Android, React Native, Flutter', 'Smartphone', 11),
('Autres Services', 'autres', 'Tous les autres services', 'Briefcase', 12)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- FIN DU SCHÉMA
-- =====================================================
