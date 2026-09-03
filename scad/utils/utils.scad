function get_dictionary_value(dictionary, key, default_val) =
    let(matches = search([key], [for (i = dictionary) i[0]]))(len(matches) > 0)
        ? dictionary[matches[0]][1]
        : default_val;

module rotate_around(a, v, p = [ 0, 0, 0 ]) {
  translate(p)
  rotate(a, v)
  translate(-p)
  children();
}