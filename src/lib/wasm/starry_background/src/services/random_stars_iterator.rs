use rand::{
    distributions::{Distribution, WeightedIndex},
    Rng,
};

use crate::{
    models::star::{Star, StarClass},
    traits::star_iterator::StarIterator,
    utils::physics::{
        angular_size, star_absolute_magnitude, star_luminosity, star_relative_magnitude,
    },
};

pub struct RandomStarsIterator {
    count: usize,
}

impl RandomStarsIterator {
    pub fn new(count: usize) -> RandomStarsIterator {
        RandomStarsIterator { count }
    }
}

impl StarIterator for RandomStarsIterator {
    fn stars(&self) -> Box<dyn Iterator<Item = Star>> {
        let stars = (0..self.count).map(move |_| {
            let mut rng = rand::thread_rng();

            let class = random_star_class(&mut rng);

            match class {
                StarClass::O => random_o_class_star(&mut rng),
                StarClass::B => random_b_class_star(&mut rng),
                StarClass::A => random_a_class_star(&mut rng),
                StarClass::F => random_f_class_star(&mut rng),
                StarClass::G => random_g_class_star(&mut rng),
                StarClass::K => random_k_class_star(&mut rng),
                StarClass::M => random_m_class_star(&mut rng),
            }
        });

        Box::new(stars)
    }
}

fn random_star_class(rng: &mut impl Rng) -> StarClass {
    const WEIGHTS: [(StarClass, f32); 7] = [
        (StarClass::O, 0.00003),
        (StarClass::B, 0.0013),
        (StarClass::A, 0.006),
        (StarClass::F, 0.03),
        (StarClass::G, 0.076),
        (StarClass::K, 0.121),
        (StarClass::M, 0.765),
    ];

    let dist = WeightedIndex::new(WEIGHTS.iter().map(|w| w.1)).unwrap();

    WEIGHTS[dist.sample(rng)].0
}

fn random_o_class_star(rng: &mut impl Rng) -> Star {
    let temp = rng.gen_range(30_000.0..50_000.0);
    let size = rng.gen_range(6.6..8.25);
    let distance = random_distance(rng);

    let luminosity = star_luminosity(size, temp);
    let brightness = star_relative_magnitude(star_absolute_magnitude(luminosity), distance);
    let angular_size = angular_size(size, distance);

    Star {
        class: StarClass::O,
        brightness,
        size: angular_size_to_pixel(angular_size),
    }
}

fn random_b_class_star(rng: &mut impl Rng) -> Star {
    let temp = rng.gen_range(9_700.0..30_000.0);
    let size = rng.gen_range(1.8..6.6);
    let distance = random_distance(rng);

    let luminosity = star_luminosity(size, temp);
    let brightness = star_relative_magnitude(star_absolute_magnitude(luminosity), distance);
    let angular_size = angular_size(size, distance);

    Star {
        class: StarClass::B,
        brightness,
        size: angular_size_to_pixel(angular_size),
    }
}

fn random_a_class_star(rng: &mut impl Rng) -> Star {
    let temp = rng.gen_range(7_200.0..9_700.0);
    let size = rng.gen_range(1.4..1.8);
    let distance = random_distance(rng);

    let luminosity = star_luminosity(size, temp);
    let brightness = star_relative_magnitude(star_absolute_magnitude(luminosity), distance);
    let angular_size = angular_size(size, distance);

    Star {
        class: StarClass::A,
        brightness,
        size: angular_size_to_pixel(angular_size),
    }
}

fn random_f_class_star(rng: &mut impl Rng) -> Star {
    let temp = rng.gen_range(5_700.0..7_200.0);
    let size = rng.gen_range(1.1..1.4);
    let distance = random_distance(rng);

    let luminosity = star_luminosity(size, temp);
    let brightness = star_relative_magnitude(star_absolute_magnitude(luminosity), distance);
    let angular_size = angular_size(size, distance);

    Star {
        class: StarClass::F,
        brightness,
        size: angular_size_to_pixel(angular_size),
    }
}

fn random_g_class_star(rng: &mut impl Rng) -> Star {
    let temp = rng.gen_range(4_900.0..5_700.0);
    let size = rng.gen_range(0.9..1.1);
    let distance = random_distance(rng);

    let luminosity = star_luminosity(size, temp);
    let brightness = star_relative_magnitude(star_absolute_magnitude(luminosity), distance);
    let angular_size = angular_size(size, distance);

    Star {
        class: StarClass::G,
        brightness,
        size: angular_size_to_pixel(angular_size),
    }
}

fn random_k_class_star(rng: &mut impl Rng) -> Star {
    let temp = rng.gen_range(3_400.0..4_900.0);
    let size = rng.gen_range(0.7..0.9);
    let distance = random_distance(rng);

    let luminosity = star_luminosity(size, temp);
    let brightness = star_relative_magnitude(star_absolute_magnitude(luminosity), distance);
    let angular_size = angular_size(size, distance);

    Star {
        class: StarClass::G,
        brightness,
        size: angular_size_to_pixel(angular_size),
    }
}

fn random_m_class_star(rng: &mut impl Rng) -> Star {
    let temp = rng.gen_range(2_100.0..3_400.0);
    let size = rng.gen_range(0.102..0.7);
    let distance = random_distance(rng);

    let luminosity = star_luminosity(size, temp);
    let brightness = star_relative_magnitude(star_absolute_magnitude(luminosity), distance).abs();
    let angular_size = angular_size(size, distance);

    Star {
        class: StarClass::M,
        brightness,
        size: angular_size_to_pixel(angular_size),
    }
}

fn random_distance(rng: &mut impl Rng) -> f32 {
    rng.gen_range(4.03e+18..9.461e+18)
}

fn angular_size_to_pixel(size: f32) -> u8 {
    (size * 1.0e+20 / 4.0).ceil() as u8
}
