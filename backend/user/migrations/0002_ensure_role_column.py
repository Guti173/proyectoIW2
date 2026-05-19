from django.db import migrations


def ensure_role_column(apps, schema_editor):
    table_name = 'user_user'
    connection = schema_editor.connection

    with connection.cursor() as cursor:
        existing_columns = {
            column.name
            for column in connection.introspection.get_table_description(cursor, table_name)
        }

    if 'role' in existing_columns:
        return

    User = apps.get_model('user', 'User')
    role_field = User._meta.get_field('role')
    schema_editor.add_field(User, role_field)


class Migration(migrations.Migration):

    dependencies = [
        ('user', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(ensure_role_column, migrations.RunPython.noop),
    ]
