from django.db import migrations, models

import apps.accounts.models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0004_userprofile_worker_details"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="profile_photo",
            field=models.ImageField(blank=True, null=True, upload_to=apps.accounts.models.profile_photo_path),
        ),
    ]
