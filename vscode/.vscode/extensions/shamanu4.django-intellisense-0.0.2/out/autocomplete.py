from pprint import pprint
import os
import re
import sys
import importlib

try:
    import django
except ImportError:
    print("['django is not installed']")

c = re.compile(".*'(\w+)'.*")


def clean_type(t):
    """
    Available types:
        Text = 0,
        Method = 1,
        Function = 2,
        Constructor = 3,
        Field = 4,
        Variable = 5,
        Class = 6,
        Interface = 7,
        Module = 8,
        Property = 9,
        Unit = 10,
        Value = 11,
        Enum = 12,
        Keyword = 13,
        Snippet = 14,
        Color = 15,
        Reference = 17,
        File = 16,
        Folder = 18,
        EnumMember = 19,
        Constant = 20,
        Struct = 21,
        Event = 22,
        Operator = 23,
        TypeParameter = 24
    """
    result = ("".join(c.findall(str(type(t)))) or "property")
    return result


this, root, settings, filename, text = sys.argv

chunks = re.findall(r"[\w|\.]+", text)

if chunks:
    token = chunks[-1]

if "." not in token:
    sys.exit(0)

path = filename.replace(root, "").strip("/").strip("\\")
path = path.replace(".py", "").replace("/", ".").replace("\\", ".")

sys.path.append(root)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", settings)
django.setup()

try:
    module = importlib.import_module(path)
except ImportError as e:
    print("['%s']" % e.replace("'", ""))
    sys.exit(0)

chunks = token.split(".")
lookup = chunks[-1]

obj = module

for i, chunk in enumerate(chunks[:-1]):
    new_obj = getattr(obj, chunk, None)
    if new_obj:
        obj = new_obj
    else:
        if i < len(chunks) - 1:
            sys.exit(0)


autocomplete = dir(obj)

if lookup and lookup[0] != '_':
    autocomplete = filter(lambda x: x[0] != '_', autocomplete)

autocomplete = filter(lambda x: lookup in x, autocomplete)

autocomplete = map(lambda x: [clean_type(
    getattr(obj, x)), x], autocomplete)

pprint(list(autocomplete))

# print(inspect.getmembers(module))
