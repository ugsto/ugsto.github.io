use std::f32::consts::PI;

const STEFAN_BOLTZMANN_CONSTANT: f32 = 5.670367e-8;
const SUN_ABSOLUTE_MAGNITUDE: f32 = 3.0128e+28;

/// Calculate luminosity of star based on its radius and temperature
/// Note: Assuming the star is a blackbody
///
/// # Arguments
/// * `radius`: Radius of star in meters
/// * `temperature`: Temperature of star in kelvin
///
/// # Returns
/// Luminosity of star in solar luminosity in watts
pub fn star_luminosity(radius: f32, temperature: f32) -> f32 {
    let area = 4.0 * PI * radius.powi(2);

    STEFAN_BOLTZMANN_CONSTANT * area * temperature.powi(4)
}

/// Calculate absolute magnitude of star
/// Note: Assuming the star is a blackbody
///
/// # Arguments
/// * `luminosity`: Luminosity of star in watts
///
/// # Returns
/// Absolute magnitude of star
pub fn star_absolute_magnitude(luminosity: f32) -> f32 {
    -2.5 * (luminosity / SUN_ABSOLUTE_MAGNITUDE).log10()
}

/// Calculate relative magnitude of star
/// Note: Assuming the star is a blackbody
///
/// # Arguments
/// * `luminosity`: Luminosity of star in watts
/// * `distance`: Distance of star in meters
///
/// # Returns
/// Relative magnitude of star
pub fn star_relative_magnitude(magnitude: f32, distance: f32) -> f32 {
    magnitude - 5.0 + 5.0 * meters_to_parsec(distance).log10()
}

/// Calculate apparent size of star
///
/// # Arguments
/// * `radius`: Radius of star in meters
/// * `distance`: Distance of star in meters
///
/// # Returns
/// Apparent size in radians
pub fn angular_size(radius: f32, distance: f32) -> f32 {
    2.0 * (radius / distance).atan()
}

pub fn meters_to_parsec(distance: f32) -> f32 {
    distance * 3.24078e-17
}

#[cfg(test)]
mod tests {
    extern crate approx;
    use super::*;
    use approx::relative_eq;

    mod sun {
        use super::*;

        const SUN_RADIUS: f32 = 6.957e+8;
        const SUN_TEMPERATURE: f32 = 5.778e+3;
        const SUN_LUMINOSITY: f32 = 3.86e+26;
        const SUN_ABSOLUTE_MAGNITUDE: f32 = 4.74;
        const SUN_DISTANCE: f32 = 1.472e+11;
        const SUN_RELATIVE_MAGNITUDE: f32 = -2.6867e+1;
        const SUN_ANGULAR_SIZE: f32 = 9.452376e-3;

        #[test]
        fn luminosity_test() {
            assert!(
                relative_eq!(
                    star_luminosity(SUN_RADIUS, SUN_TEMPERATURE),
                    SUN_LUMINOSITY,
                    epsilon = 1e+25
                ),
                "Left: {}, Right: {}",
                star_luminosity(SUN_RADIUS, SUN_TEMPERATURE),
                SUN_LUMINOSITY
            )
        }

        #[test]
        fn absolute_magnitude_test() {
            assert!(
                relative_eq!(
                    star_absolute_magnitude(SUN_LUMINOSITY),
                    SUN_ABSOLUTE_MAGNITUDE,
                    epsilon = 1e-1
                ),
                "Left: {}, Right: {}",
                star_absolute_magnitude(SUN_LUMINOSITY),
                SUN_ABSOLUTE_MAGNITUDE
            );
        }

        #[test]
        fn relative_magnitude_test() {
            assert!(
                relative_eq!(
                    star_relative_magnitude(SUN_ABSOLUTE_MAGNITUDE, SUN_DISTANCE),
                    SUN_RELATIVE_MAGNITUDE,
                    epsilon = 1e-3
                ),
                "Left: {}, Right: {}",
                star_relative_magnitude(SUN_ABSOLUTE_MAGNITUDE, SUN_DISTANCE),
                SUN_RELATIVE_MAGNITUDE
            );
        }

        #[test]
        fn angular_size_test() {
            assert!(
                relative_eq!(angular_size(SUN_RADIUS, SUN_DISTANCE), SUN_ANGULAR_SIZE),
                "Left: {}, Right: {}",
                angular_size(SUN_RADIUS, SUN_DISTANCE),
                SUN_ANGULAR_SIZE
            );
        }
    }

    mod external_stars {
        use super::*;

        #[test]
        fn luminosity_test() {
            assert!(
                relative_eq!(star_luminosity(1.0e+3, 1.0e+3), 7.096e+11, epsilon = 1e+10),
                "Left: {}, Right: {}",
                star_luminosity(1.0e+3, 1.0e+3),
                7.096e+12
            );
        }

        #[test]
        fn absolute_magnitude_test() {
            assert!(
                relative_eq!(star_absolute_magnitude(1.0e+9), 4.87e+1, epsilon = 1.0),
                "Left: {}, Right: {}",
                star_absolute_magnitude(1.0e+9),
                4.87e+1
            );
        }

        #[test]
        fn relative_magnitude_test() {
            assert!(
                relative_eq!(
                    star_relative_magnitude(1.0e+2, 1.0e+18),
                    1.0255e+2,
                    epsilon = 1.0e-2
                ),
                "Left: {}, Right: {}",
                star_relative_magnitude(1.0e+2, 1.0e+18),
                1.0255e+2,
            );
        }

        #[test]
        fn angular_size_test() {
            assert!(
                relative_eq!(angular_size(1.0, 1.0), 1.5707964),
                "Left: {}, Right: {}",
                angular_size(1.0, 1.0),
                1.5707964
            )
        }
    }
}
