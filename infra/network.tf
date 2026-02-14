resource "google_compute_network" "vpc_network" {
  name                    = "live-call-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnet" {
  name          = "live-call-subnet"
  ip_cidr_range = "10.0.1.0/24"
  region        = var.region
  network       = google_compute_network.vpc_network.id
}

resource "google_compute_address" "static_ip" {
  name   = "live-call-static-ip"
  region = var.region
}

resource "google_compute_firewall" "allow_ssh" {
  name    = "allow-ssh"
  network = google_compute_network.vpc_network.name

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = ["0.0.0.0/0"]
}

resource "google_compute_firewall" "allow_http" {
  name    = "allow-http"
  network = google_compute_network.vpc_network.name

  allow {
    protocol = "tcp"
    ports    = ["80", "443", "3000", "4000", "5000", "6000", "3001", "9090", "9000", "8500"]
  }

  source_ranges = ["0.0.0.0/0"]
}

resource "google_compute_firewall" "allow_webrtc" {
  name    = "allow-webrtc"
  network = google_compute_network.vpc_network.name

  allow {
    protocol = "udp"
    ports    = ["40000-40100"]
  }

  source_ranges = ["0.0.0.0/0"]
}
