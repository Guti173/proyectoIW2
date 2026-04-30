from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("user", "0002_user_role"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="user",
            name="group",
        ),
        migrations.DeleteModel(
            name="Group",
        ),
    ]
