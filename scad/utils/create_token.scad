use <utils.scad>
use <arc.scad>;
use <arc_text.scad>

module create_text(token) {
  lines = get_dictionary_value(token, "lines", []);
  font_sizes = get_dictionary_value(token, "font_sizes", [font_size]);
  apertures = get_dictionary_value(token, "apertures", [angle]);

  center_diameter = base_diameter + (ribbon_width / font_height_offset);

  for (i = [0:len(lines) - 1]) {
    line = lines[i];
    size = (i < len(font_sizes)) ? font_sizes[i] : font_size;
    angle = (i < len(apertures)) ? apertures[i] : 180;

    shift = (len(lines) == 1) ? 0 : (i == 0 ? -size / 2 - 1 : size / 2 + 1);

    line_diameter = center_diameter + shift;

    color("red")
    translate([ 0, 0, height ])
    arc_text(
      chars = line,
      diameter = line_diameter,
      font = font,
      size = size,
      angle = angle
    );
  }
}


module create_logo(logo) {
  path = get_dictionary_value(logo, "path", "");
  rotation = get_dictionary_value(logo, "rotation", 0);
  mirrored = get_dictionary_value(logo, "mirrored", false) ? 1 : 0;
  scaled = get_dictionary_value(logo, "scaled", 1);

  color("blue")
  translate([ 0, 0, height ])
  mirror([ mirrored, 0, 0 ])
  rotate([ 0, 0, rotation ])
  scale([ scaled, scaled, scaled ])  
  resize([ nob_diameter, 0 ], auto=true)

  import(path, center = true);

  children();
}

module create_nob(logo, rotation_offset) {
  cylinder(
    r1 = nob_diameter,
    r2 = nob_diameter,
    h = height
   );
  children();
}

module create_token(token) {
  rotate_around([ 0, 0, -aperture ])
  translate([ 0, -(base_diameter + nob_diameter), 0 ])
  create_nob()
  create_logo(logo_left);

  rotate_around([ 0, 0, aperture ])
  translate([ 0, -(base_diameter + nob_diameter), 0 ])
  create_nob()
  create_logo(logo_right);

  arc(
    r1 = base_diameter + ribbon_width,
    r2 = base_diameter,
    a1 = 270 - aperture,
    a2 = 270 + aperture,
    h = height
  );
  
  create_text(token);
}

module generate_tokens(tokens) {
  x_spacing = base_diameter * 4;
  y_spacing = base_diameter * 3;

  cols = ceil(sqrt(len(tokens)));

  for (i = [0:len(tokens) - 1]) {
    row = floor(i / cols);
    col = i % cols;

    translate([ x_spacing * col, -y_spacing * row, 0 ]) {
      #cylinder(r1=base_diameter, r2=base_diameter, h=height);
      create_token(tokens[i]);
    }
  }
}
