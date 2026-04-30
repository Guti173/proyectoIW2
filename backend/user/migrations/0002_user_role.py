# Generated manually for adding simple user roles.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("user", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="role",
            field=models.CharField(
                choices=[("user", "User"), ("admin", "Admin")],
                default="user",
                max_length=20,
            ),
        ),
    ]
