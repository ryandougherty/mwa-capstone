from app.flask_app import app
import re, urllib.parse

# Sets should be inserted into comments using the special syntax
# @set(set name). This string will be replaced by a hyperlink to the
# set.
def set_hyperlink_filter(comment):
    comment_copy = str(comment)

    EXPR_START_TEXT = '@set('
    EXPR_START_REGEX = '@set\('
    for expr in re.finditer(EXPR_START_REGEX, comment):
        paren_count = 1
        closing_paren_index = -1
        for char_index in range(expr.start() + len(EXPR_START_TEXT), len(comment)):
            if comment[char_index] == '(':
                paren_count += 1
            elif comment[char_index] == ')':
                paren_count -= 1

            if paren_count == 0:
                closing_paren_index = char_index
                break

        if closing_paren_index == -1:
            continue

        set_name = comment[expr.start() + len(EXPR_START_TEXT) : closing_paren_index]
        set_name_stripped = set_name.strip() # Set names aren't allowed to have leading/trailing whitespace.

        set_name_escaped_for_url = urllib.parse.quote(set_name_stripped)

        link = "<a href='/set/" + set_name_escaped_for_url + "' target='_blank'>" + set_name + "</a>"

        comment_copy = comment_copy.replace(EXPR_START_TEXT + set_name + ')', link, 1)

    return comment_copy

app.jinja_env.filters['set_hyperlinks'] = set_hyperlink_filter
