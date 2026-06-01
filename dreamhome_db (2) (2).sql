-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : dim. 31 mai 2026 à 21:47
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `dreamhome_db`
--

-- --------------------------------------------------------

--
-- Structure de la table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `property_id` int(11) DEFAULT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `properties`
--

CREATE TABLE `properties` (
  `id` int(11) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `price_usd` decimal(10,2) DEFAULT NULL,
  `price_dzd` decimal(15,2) DEFAULT NULL,
  `bedrooms` int(11) DEFAULT 2,
  `bathrooms` int(11) DEFAULT 2,
  `area` int(11) DEFAULT 100,
  `max_guests` int(11) DEFAULT 4,
  `rating` decimal(3,2) DEFAULT 0.00,
  `reviews_count` int(11) DEFAULT 0,
  `status` enum('available','booked','inactive','draft') DEFAULT 'available',
  `admin_status` enum('pending','approved','rejected') DEFAULT 'pending',
  `featured` tinyint(1) DEFAULT 0,
  `transformation_options` text DEFAULT NULL COMMENT 'JSON array of available transformation types',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `properties`
--

INSERT INTO `properties` (`id`, `owner_id`, `name`, `description`, `location`, `district`, `type`, `price_usd`, `price_dzd`, `bedrooms`, `bathrooms`, `area`, `max_guests`, `rating`, `reviews_count`, `status`, `admin_status`, `featured`, `transformation_options`, `created_at`, `updated_at`) VALUES
(1, 2, 'Appartement Luxe Annaba Centre', 'Magnifique appartement en plein cœur d\'Annaba avec vue sur la ville', 'annaba', 'ANNABA CENTER', 'apartment', NULL, 18500000.00, 3, 2, 145, 6, 4.80, 45, 'available', 'approved', 1, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(2, 2, 'Studio Moderne Annaba', 'Studio moderne idéal pour étudiants ou jeunes professionnels', 'annaba', 'ANNABA CENTER', 'studio', NULL, 5500000.00, 1, 1, 48, 2, 4.50, 28, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(3, 2, 'Penthouse Vue Mer Annaba', 'Penthouse exceptionnel avec terrasse panoramique et vue sur la mer', 'annaba', 'ANNABA CENTER', 'penthouse', NULL, 35000000.00, 4, 3, 220, 8, 4.90, 52, 'available', 'approved', 1, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(4, 2, 'Duplex Centre Ville', 'Magnifique duplex avec jardin privé au cœur d\'Annaba', 'annaba', 'ANNABA CENTER', 'duplex', NULL, 22000000.00, 3, 2, 180, 7, 4.70, 35, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(5, 2, 'Loft Contemporain', 'Loft design avec hauts plafonds et matériaux nobles', 'annaba', 'ANNABA CENTER', 'loft', NULL, 15500000.00, 2, 2, 130, 5, 4.85, 31, 'available', 'approved', 1, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(6, 2, 'Appartement Familial', 'Grand appartement proche des commodités, parfait pour une famille', 'annaba', 'ANNABA CENTER', 'apartment', NULL, 12500000.00, 3, 2, 120, 6, 4.60, 28, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(7, 2, 'Villa de Luxe Seraïdi', 'Magnifique villa avec vue imprenable sur la mer Méditerranée', 'seraidi', 'SERAIDI', 'villa', NULL, 75000000.00, 6, 5, 550, 14, 5.00, 89, 'available', 'approved', 1, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(8, 2, 'Duplex Vue Mer Seraïdi', 'Duplex moderne avec terrasse et vue panoramique', 'seraidi', 'SERAIDI', 'duplex', NULL, 28000000.00, 4, 3, 195, 8, 4.85, 41, 'available', 'approved', 1, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(9, 2, 'Villa Contemporaine Seraïdi', 'Villa moderne avec piscine privée et grand jardin', 'seraidi', 'SERAIDI', 'villa', NULL, 45000000.00, 5, 4, 380, 12, 4.95, 67, 'available', 'approved', 1, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(10, 2, 'Appartement Vue Mer Seraïdi', 'Appartement cosy avec vue sur la mer', 'seraidi', 'SERAIDI', 'apartment', NULL, 12000000.00, 2, 2, 95, 4, 4.60, 23, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(11, 2, 'Studio Vue Panoramique Seraïdi', 'Petit studio avec vue exceptionnelle', 'seraidi', 'SERAIDI', 'studio', NULL, 4800000.00, 1, 1, 40, 2, 4.40, 15, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(12, 2, 'Villa Traditionnelle Seraïdi', 'Villa de caractère avec architecture traditionnelle', 'seraidi', 'SERAIDI', 'villa', NULL, 32000000.00, 4, 3, 280, 10, 4.75, 34, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(13, 2, 'Villa El Bouni', 'Superbe villa avec grand jardin et piscine', 'el-bouni', 'EL BOUNI', 'villa', NULL, 42000000.00, 5, 4, 400, 12, 4.90, 67, 'available', 'approved', 1, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(14, 2, 'Loft El Bouni', 'Loft contemporain design avec finitions haut de gamme', 'el-bouni', 'EL BOUNI', 'loft', NULL, 18500000.00, 2, 2, 140, 5, 4.80, 29, 'available', 'approved', 1, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(15, 2, 'Appartement Moderne El Bouni', 'Appartement moderne dans une résidence sécurisée', 'el-bouni', 'EL BOUNI', 'apartment', NULL, 8500000.00, 3, 2, 110, 6, 4.70, 38, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(16, 2, 'Duplex Familial El Bouni', 'Grand duplex pour famille nombreuse', 'el-bouni', 'EL BOUNI', 'duplex', NULL, 19500000.00, 4, 3, 170, 9, 4.75, 26, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(17, 2, 'Villa de Standing El Bouni', 'Villa de prestige avec tous les équipements', 'el-bouni', 'EL BOUNI', 'villa', NULL, 55000000.00, 5, 5, 450, 12, 4.95, 52, 'available', 'approved', 1, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(18, 2, 'Studio El Bouni', 'Studio économique proche des écoles', 'el-bouni', 'EL BOUNI', 'studio', NULL, 3800000.00, 1, 1, 35, 2, 4.30, 14, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(19, 2, 'Villa Sidi Amar', 'Villa familiale dans un quartier résidentiel calme', 'sidi-amar', 'SIDI AMAR', 'villa', NULL, 25000000.00, 4, 3, 280, 10, 4.65, 31, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(20, 2, 'Studio Étudiant Sidi Amar', 'Studio économique pour étudiants à proximité de l\'université', 'sidi-amar', 'SIDI AMAR', 'studio', NULL, 2900000.00, 1, 1, 35, 2, 4.20, 18, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(21, 2, 'Appartement Cosy Sidi Amar', 'Appartement chaleureux proche des commerces', 'sidi-amar', 'SIDI AMAR', 'apartment', NULL, 6800000.00, 2, 2, 85, 4, 4.50, 22, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(22, 2, 'Duplex Sidi Amar', 'Duplex moderne avec terrasse', 'sidi-amar', 'SIDI AMAR', 'duplex', NULL, 15000000.00, 3, 2, 140, 7, 4.70, 19, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(23, 2, 'Maison Individuelle Sidi Amar', 'Maison avec jardin, idéal pour famille', 'sidi-amar', 'SIDI AMAR', 'villa', NULL, 18500000.00, 3, 2, 210, 8, 4.55, 27, 'available', 'approved', 1, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(24, 2, 'Loft Artiste Sidi Amar', 'Loft atypique avec grand espace de vie', 'sidi-amar', 'SIDI AMAR', 'loft', NULL, 12000000.00, 2, 1, 110, 4, 4.60, 16, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(25, 2, 'Villa de Plage Chetaïbi', 'Magnifique villa en première ligne de mer', 'chetaibi', 'CHETAÏBI', 'villa', NULL, 85000000.00, 6, 5, 500, 14, 5.00, 112, 'available', 'approved', 1, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(26, 2, 'Appartement Vue Mer Chetaïbi', 'Appartement avec vue imprenable sur la mer', 'chetaibi', 'CHETAÏBI', 'apartment', NULL, 16500000.00, 3, 2, 125, 6, 4.80, 34, 'available', 'approved', 1, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(27, 2, 'Bungalow Chetaïbi', 'Bungalow charmant proche de la plage', 'chetaibi', 'CHETAÏBI', 'villa', NULL, 22000000.00, 3, 2, 120, 6, 4.70, 28, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(28, 2, 'Studio Pied dans l\'Eau Chetaïbi', 'Studio de vacances face à la mer', 'chetaibi', 'CHETAÏBI', 'studio', NULL, 5500000.00, 1, 1, 40, 2, 4.50, 21, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(29, 2, 'Villa de Vacances Chetaïbi', 'Villa idéale pour les vacances d\'été', 'chetaibi', 'CHETAÏBI', 'villa', NULL, 48000000.00, 5, 4, 350, 12, 4.85, 47, 'available', 'approved', 1, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(30, 2, 'Duplex Vue Mer Chetaïbi', 'Duplex avec terrasse face à la mer', 'chetaibi', 'CHETAÏBI', 'duplex', NULL, 25000000.00, 3, 2, 150, 7, 4.75, 25, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(31, 2, 'Villa Contemporaine El Hadjar', 'Villa moderne avec piscine et grand jardin', 'el-hadjar', 'EL HADJAR', 'villa', NULL, 38000000.00, 5, 4, 380, 12, 4.75, 44, 'available', 'approved', 1, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(32, 2, 'Appartement El Hadjar', 'Appartement spacieux proche de toutes les commodités', 'el-hadjar', 'EL HADJAR', 'apartment', NULL, 9800000.00, 3, 2, 125, 6, 4.50, 26, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(33, 2, 'Studio El Hadjar', 'Studio pratique pour travailleurs', 'el-hadjar', 'EL HADJAR', 'studio', NULL, 3200000.00, 1, 1, 38, 2, 4.20, 12, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(34, 2, 'Villa Traditionnelle El Hadjar', 'Villa de caractère avec architecture locale', 'el-hadjar', 'EL HADJAR', 'villa', NULL, 22000000.00, 4, 3, 260, 10, 4.65, 29, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(35, 2, 'Duplex El Hadjar', 'Duplex moderne dans quartier calme', 'el-hadjar', 'EL HADJAR', 'duplex', NULL, 13500000.00, 3, 2, 135, 6, 4.55, 18, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(36, 2, 'Villa de Luxe El Hadjar', 'Villa exceptionnelle avec tous les équipements', 'el-hadjar', 'EL HADJAR', 'villa', NULL, 50000000.00, 5, 4, 420, 12, 4.90, 38, 'available', 'approved', 1, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(37, 2, 'Villa Ain Berda', 'Villa au cœur de la nature avec vue sur les montagnes', 'ain-berda', 'AIN BERDA', 'villa', NULL, 32000000.00, 4, 3, 280, 10, 4.75, 35, 'available', 'approved', 1, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(38, 2, 'Ferme Rénovée Ain Berda', 'Ferme traditionnelle transformée en résidence moderne', 'ain-berda', 'AIN BERDA', 'villa', NULL, 18500000.00, 3, 2, 200, 8, 4.60, 22, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(39, 2, 'Appartement Ain Berda', 'Appartement moderne dans nouvelle résidence', 'ain-berda', 'AIN BERDA', 'apartment', NULL, 7500000.00, 2, 1, 85, 4, 4.40, 16, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(40, 2, 'Maison de Campagne Ain Berda', 'Maison avec grand terrain agricole', 'ain-berda', 'AIN BERDA', 'villa', NULL, 15500000.00, 3, 2, 180, 8, 4.55, 19, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(41, 2, 'Studio Ain Berda', 'Petit studio économique', 'ain-berda', 'AIN BERDA', 'studio', NULL, 2800000.00, 1, 1, 32, 2, 4.10, 9, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(42, 2, 'Villa Moderne Ain Berda', 'Villa contemporaine avec piscine', 'ain-berda', 'AIN BERDA', 'villa', NULL, 40000000.00, 4, 3, 320, 10, 4.85, 28, 'available', 'approved', 1, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(43, 2, 'Villa Boulimat', 'Villa de luxe dans un quartier résidentiel calme', 'boulimat', 'BOULIMAT', 'villa', NULL, 45000000.00, 5, 4, 400, 12, 4.90, 61, 'available', 'approved', 1, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(44, 2, 'Appartement Boulimat', 'Appartement spacieux avec vue dégagée', 'boulimat', 'BOULIMAT', 'apartment', NULL, 9500000.00, 3, 2, 115, 6, 4.55, 24, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(45, 2, 'Duplex Boulimat', 'Duplex moderne avec terrasse', 'boulimat', 'BOULIMAT', 'duplex', NULL, 16000000.00, 3, 2, 145, 7, 4.70, 20, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(46, 2, 'Villa Contemporaine Boulimat', 'Villa design avec piscine', 'boulimat', 'BOULIMAT', 'villa', NULL, 52000000.00, 5, 4, 380, 12, 4.85, 42, 'available', 'approved', 1, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(47, 2, 'Studio Boulimat', 'Studio pratique proche des commodités', 'boulimat', 'BOULIMAT', 'studio', NULL, 3500000.00, 1, 1, 38, 2, 4.30, 11, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(48, 2, 'Loft Boulimat', 'Loft spacieux avec jardin', 'boulimat', 'BOULIMAT', 'loft', NULL, 14500000.00, 2, 2, 130, 5, 4.65, 17, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(49, 2, 'Villa Plateau Annaba', 'Villa de prestige sur le plateau d\'Annaba', 'plateau', 'PLATEAU', 'villa', NULL, 52000000.00, 5, 4, 450, 12, 4.95, 73, 'available', 'approved', 1, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(50, 2, 'Appartement Vue Panoramique', 'Appartement avec vue imprenable sur Annaba', 'plateau', 'PLATEAU', 'apartment', NULL, 16500000.00, 3, 2, 130, 6, 4.80, 36, 'available', 'approved', 1, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(51, 2, 'Duplex Plateau', 'Duplex lumineux avec grande terrasse', 'plateau', 'PLATEAU', 'duplex', NULL, 25000000.00, 4, 3, 190, 8, 4.85, 41, 'available', 'approved', 1, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(52, 2, 'Villa Moderne Plateau', 'Villa contemporaine avec piscine', 'plateau', 'PLATEAU', 'villa', NULL, 62000000.00, 5, 5, 480, 14, 4.95, 58, 'available', 'approved', 1, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(53, 2, 'Studio Plateau', 'Studio cosy avec vue', 'plateau', 'PLATEAU', 'studio', NULL, 4500000.00, 1, 1, 45, 2, 4.45, 14, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(54, 2, 'Penthouse de Luxe Plateau', 'Penthouse exceptionnel avec terrasse', 'plateau', 'PLATEAU', 'penthouse', NULL, 45000000.00, 4, 3, 250, 8, 4.95, 45, 'available', 'approved', 1, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(55, 2, 'Villa Saint Cloud', 'Villa traditionnelle rénovée dans le quartier historique', 'st-cloud', 'SAINT CLOUD', 'villa', NULL, 29000000.00, 4, 3, 260, 10, 4.75, 39, 'available', 'approved', 1, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(56, 2, 'Appartement Saint Cloud', 'Appartement rénové dans quartier calme', 'st-cloud', 'SAINT CLOUD', 'apartment', NULL, 8200000.00, 2, 2, 95, 4, 4.50, 21, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(57, 2, 'Maison de Maître Saint Cloud', 'Maison historique rénovée avec jardin', 'st-cloud', 'SAINT CLOUD', 'villa', NULL, 35000000.00, 5, 3, 320, 10, 4.85, 32, 'available', 'approved', 1, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(58, 2, 'Studio Saint Cloud', 'Petit studio charmant', 'st-cloud', 'SAINT CLOUD', 'studio', NULL, 3000000.00, 1, 1, 35, 2, 4.25, 13, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(59, 2, 'Duplex Saint Cloud', 'Duplex avec cachet', 'st-cloud', 'SAINT CLOUD', 'duplex', NULL, 14000000.00, 3, 2, 130, 6, 4.60, 18, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(60, 2, 'Villa Contemporaine Saint Cloud', 'Villa moderne avec piscine', 'st-cloud', 'SAINT CLOUD', 'villa', NULL, 48000000.00, 5, 4, 400, 12, 4.90, 44, 'available', 'approved', 1, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(61, 2, 'Ferme Berrahal', 'Ferme authentique avec grand terrain agricole', 'berrahal', 'BERRAHAL', 'villa', NULL, 18500000.00, 4, 3, 350, 10, 4.60, 28, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(62, 2, 'Maison Berrahal', 'Maison traditionnelle rénovée', 'berrahal', 'BERRAHAL', 'villa', NULL, 12000000.00, 3, 2, 180, 7, 4.50, 16, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(63, 2, 'Studio Berrahal', 'Studio économique', 'berrahal', 'BERRAHAL', 'studio', NULL, 2200000.00, 1, 1, 30, 2, 4.05, 8, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(64, 2, 'Villa Berrahal', 'Villa moderne avec piscine', 'berrahal', 'BERRAHAL', 'villa', NULL, 28000000.00, 4, 3, 300, 10, 4.75, 24, 'available', 'approved', 1, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(65, 2, 'Appartement Berrahal', 'Appartement confortable', 'berrahal', 'BERRAHAL', 'apartment', NULL, 5500000.00, 2, 1, 75, 4, 4.30, 12, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(66, 2, 'Gîte Rural Berrahal', 'Gîte parfait pour les amoureux de la nature', 'berrahal', 'BERRAHAL', 'villa', NULL, 9500000.00, 3, 2, 150, 8, 4.55, 19, 'available', 'approved', 0, NULL, '2026-05-31 16:38:03', '2026-05-31 16:38:03');

-- --------------------------------------------------------

--
-- Structure de la table `property_images`
--

CREATE TABLE `property_images` (
  `id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `is_primary` tinyint(1) DEFAULT 0,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `property_images`
--

INSERT INTO `property_images` (`id`, `property_id`, `image_url`, `is_primary`, `sort_order`, `created_at`) VALUES
(1, 1, 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&auto=format', 1, 0, '2026-05-31 16:38:03'),
(2, 2, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format', 1, 0, '2026-05-31 16:38:03'),
(3, 3, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format', 1, 0, '2026-05-31 16:38:03'),
(4, 4, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format', 1, 0, '2026-05-31 16:38:03'),
(5, 5, 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&auto=format', 1, 0, '2026-05-31 16:38:03'),
(6, 7, 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&auto=format', 1, 0, '2026-05-31 16:38:03'),
(7, 8, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format', 1, 0, '2026-05-31 16:38:03'),
(8, 13, 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format', 1, 0, '2026-05-31 16:38:03'),
(9, 14, 'https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=800&auto=format', 1, 0, '2026-05-31 16:38:03'),
(10, 25, 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&auto=format', 1, 0, '2026-05-31 16:38:03');

-- --------------------------------------------------------

--
-- Structure de la table `reservations`
--

CREATE TABLE `reservations` (
  `id` int(11) NOT NULL,
  `booking_ref` varchar(50) DEFAULT NULL,
  `property_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `usage_type` varchar(50) DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `number_of_days` int(11) DEFAULT 1,
  `total_amount_dzd` decimal(15,2) DEFAULT NULL,
  `status` enum('pending','confirmed','cancelled','completed') DEFAULT 'pending',
  `payment_method` varchar(50) DEFAULT NULL,
  `special_requests` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `reservations`
--

INSERT INTO `reservations` (`id`, `booking_ref`, `property_id`, `user_id`, `usage_type`, `start_date`, `end_date`, `number_of_days`, `total_amount_dzd`, `status`, `payment_method`, `special_requests`, `created_at`) VALUES
(1, 'DREAM-20260531-1807', 2, 3, 'kitchen', '2026-07-07', '2026-07-09', 2, 24000.00, 'pending', 'card', NULL, '2026-05-31 17:01:20'),
(2, 'DREAM-20260531-6372', 1, 3, 'workspace', '2026-07-08', '2026-07-10', 2, 5000.00, 'confirmed', 'card', NULL, '2026-05-31 17:02:40'),
(3, 'DREAM-20260531-2036', 33, 3, 'studio', '2026-07-06', '2026-07-08', 2, 6416000.00, 'pending', 'baridimob', NULL, '2026-05-31 19:27:37');

-- --------------------------------------------------------

--
-- Structure de la table `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `rating` int(11) DEFAULT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `reviews`
--

INSERT INTO `reviews` (`id`, `user_id`, `property_id`, `rating`, `comment`, `created_at`) VALUES
(1, 3, 1, 5, 'Magnifique appartement, vue superbe, très bien situé', '2026-05-31 16:38:03'),
(2, 3, 2, 4, 'Très bon studio, propre et bien équipé', '2026-05-31 16:38:03'),
(3, 3, 7, 5, 'Villa exceptionnelle, vue à couper le souffle', '2026-05-31 16:38:03');

-- --------------------------------------------------------

--
-- Structure de la table `transformation_requests`
--

CREATE TABLE `transformation_requests` (
  `id` int(11) NOT NULL,
  `booking_id` int(11) DEFAULT NULL COMMENT 'Associated booking ID (if any)',
  `property_id` int(11) NOT NULL COMMENT 'Property being requested for transformation',
  `user_id` int(11) NOT NULL COMMENT 'Tenant making the request',
  `room_name` varchar(100) NOT NULL COMMENT 'Room to transform (e.g., living_room, kitchen, garage, bedroom)',
  `transformation_type` varchar(100) NOT NULL COMMENT 'Type of transformation (e.g., photo_studio, professional_kitchen)',
  `duration_hours` int(11) DEFAULT NULL COMMENT 'Requested duration in hours',
  `additional_equipment` text DEFAULT NULL COMMENT 'Additional equipment needed',
  `special_instructions` text DEFAULT NULL COMMENT 'Special instructions for the owner',
  `preferred_date` date DEFAULT NULL COMMENT 'Preferred date for the transformation',
  `estimated_price` decimal(15,2) DEFAULT NULL COMMENT 'Owner''s estimated price',
  `status` enum('pending','approved','rejected','completed','cancelled') DEFAULT 'pending',
  `owner_response` text DEFAULT NULL COMMENT 'Owner''s response message',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `role` enum('admin','owner','tenant') DEFAULT 'tenant',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `first_name`, `last_name`, `phone`, `city`, `bio`, `role`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'admin@dreamhome.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Super', 'Admin', '+213551234567', 'Annaba', 'Platform Administrator', 'admin', 1, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(2, 'owner@demo.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Demo', 'Owner', '+213551234568', 'Annaba', 'Property Owner', 'owner', 1, '2026-05-31 16:38:03', '2026-05-31 16:38:03'),
(3, 'tenant@demo.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Demo', 'Tenant', '+213551234569', 'Annaba', 'Regular Tenant', 'tenant', 1, '2026-05-31 16:38:03', '2026-05-31 16:38:03');

-- --------------------------------------------------------

--
-- Structure de la table `user_interactions`
--

CREATE TABLE `user_interactions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `action` varchar(50) NOT NULL COMMENT 'view, click, search, booking, contact',
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `user_interactions`
--

INSERT INTO `user_interactions` (`id`, `user_id`, `property_id`, `action`, `created_at`) VALUES
(1, 3, 1, 'view', '2026-05-31 17:38:26'),
(2, 3, 7, 'view', '2026-05-31 18:01:53'),
(3, 3, 13, 'view', '2026-05-31 18:13:31'),
(4, 3, 33, 'view', '2026-05-31 20:27:00'),
(5, 3, 63, 'view', '2026-05-31 20:29:28'),
(6, 3, 58, 'view', '2026-05-31 20:32:42'),
(7, 3, 41, 'view', '2026-05-31 20:44:50');

-- --------------------------------------------------------

--
-- Structure de la table `wishlist`
--

CREATE TABLE `wishlist` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `wishlist`
--

INSERT INTO `wishlist` (`id`, `user_id`, `property_id`, `created_at`) VALUES
(1, 3, 33, '2026-05-31 19:27:03'),
(2, 3, 63, '2026-05-31 19:35:59');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `receiver_id` (`receiver_id`),
  ADD KEY `property_id` (`property_id`);

--
-- Index pour la table `properties`
--
ALTER TABLE `properties`
  ADD PRIMARY KEY (`id`),
  ADD KEY `owner_id` (`owner_id`),
  ADD KEY `idx_location` (`location`),
  ADD KEY `idx_district` (`district`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_price` (`price_dzd`);

--
-- Index pour la table `property_images`
--
ALTER TABLE `property_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `property_id` (`property_id`);

--
-- Index pour la table `reservations`
--
ALTER TABLE `reservations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `booking_ref` (`booking_ref`),
  ADD KEY `property_id` (`property_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Index pour la table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_review` (`user_id`,`property_id`),
  ADD KEY `property_id` (`property_id`);

--
-- Index pour la table `transformation_requests`
--
ALTER TABLE `transformation_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `booking_id` (`booking_id`),
  ADD KEY `property_id` (`property_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `status` (`status`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Index pour la table `user_interactions`
--
ALTER TABLE `user_interactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_property` (`property_id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_created` (`created_at`);

--
-- Index pour la table `wishlist`
--
ALTER TABLE `wishlist`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_wishlist` (`user_id`,`property_id`),
  ADD KEY `property_id` (`property_id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `properties`
--
ALTER TABLE `properties`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=67;

--
-- AUTO_INCREMENT pour la table `property_images`
--
ALTER TABLE `property_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT pour la table `reservations`
--
ALTER TABLE `reservations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `transformation_requests`
--
ALTER TABLE `transformation_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `user_interactions`
--
ALTER TABLE `user_interactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `wishlist`
--
ALTER TABLE `wishlist`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_3` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `properties`
--
ALTER TABLE `properties`
  ADD CONSTRAINT `properties_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `property_images`
--
ALTER TABLE `property_images`
  ADD CONSTRAINT `property_images_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `reservations`
--
ALTER TABLE `reservations`
  ADD CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reservations_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `transformation_requests`
--
ALTER TABLE `transformation_requests`
  ADD CONSTRAINT `transformation_requests_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `reservations` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `transformation_requests_ibfk_2` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transformation_requests_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `wishlist`
--
ALTER TABLE `wishlist`
  ADD CONSTRAINT `wishlist_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `wishlist_ibfk_2` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
